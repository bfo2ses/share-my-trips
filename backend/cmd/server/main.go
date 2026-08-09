package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"golang.org/x/crypto/bcrypt"

	"github.com/bfosses/sharemytrips/internal/adapter/crypto"
	"github.com/bfosses/sharemytrips/internal/adapter/filesystem"
	imaging "github.com/bfosses/sharemytrips/internal/adapter/imaging"
	"github.com/bfosses/sharemytrips/internal/adapter/mailer"
	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	pg "github.com/bfosses/sharemytrips/internal/adapter/postgres"
	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
	graph "github.com/bfosses/sharemytrips/internal/graphql"
	mediahttp "github.com/bfosses/sharemytrips/internal/http"
	"github.com/bfosses/sharemytrips/migrations"
)

func corsMiddleware(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	ctx := context.Background()

	// Shared adapters.
	hasher, err := crypto.NewBcryptHasher(bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to create hasher: %v", err)
	}
	tokenGen := &crypto.UUIDTokenGenerator{}

	resetURLBase := os.Getenv("RESET_URL_BASE")
	if resetURLBase == "" {
		resetURLBase = "http://localhost:5173/reset-password"
	}

	var mailSender auth.Mailer
	if smtpHost := os.Getenv("SMTP_HOST"); smtpHost != "" {
		mailSender = mailer.NewSMTPMailer(mailer.SMTPConfig{
			Host:         smtpHost,
			Port:         os.Getenv("SMTP_PORT"),
			From:         os.Getenv("SMTP_FROM"),
			Username:     os.Getenv("SMTP_USERNAME"),
			Password:     os.Getenv("SMTP_PASSWORD"),
			ResetURLBase: resetURLBase,
		})
		log.Println("Using SMTP mailer")
	} else {
		mailSender = mailer.NewLogMailer(resetURLBase)
		log.Println("Using log mailer (set SMTP_HOST for real emails)")
	}

	mediaBasePath := os.Getenv("MEDIA_PATH")
	if mediaBasePath == "" {
		mediaBasePath = "./media_data"
	}
	mediaStorage := filesystem.NewStorage(mediaBasePath)
	thumbnailer := imaging.NewThumbnailer()

	// Domain handlers — wired with either postgres or in-memory adapters.
	var tripHandler *trip.Handler
	var stageHandler *stage.Handler
	var visitHandler *visit.Handler
	var authHandler *auth.Handler
	var mediaHandler *media.Handler
	var travelLegRepo travelleg.Repository

	dsn := os.Getenv("DATABASE_URL")

	if dsn != "" {
		// ── PostgreSQL ──
		pool, err := pg.NewPool(ctx, dsn)
		if err != nil {
			log.Fatalf("postgres: %v", err)
		}
		defer pool.Close()

		if err := pg.RunMigrations(dsn, migrations.FS); err != nil {
			log.Fatalf("migrations: %v", err)
		}

		tripRepo := pg.NewTripRepository(pool)
		stageRepo := pg.NewStageRepository(pool)
		visitRepo := pg.NewVisitRepository(pool)
		tripChecker := pg.NewTripChecker(pool)

		tripHandler = trip.NewHandler(tripRepo)
		stageHandler = stage.NewHandler(stageRepo, tripChecker, visitRepo)
		visitHandler = visit.NewHandler(visitRepo, tripChecker, stageRepo)

		userRepo := pg.NewUserRepository(pool)
		sessionRepo := pg.NewSessionRepository(pool)
		resetRepo := pg.NewResetRepository(pool)
		authHandler = auth.NewHandler(userRepo, sessionRepo, resetRepo, hasher, tokenGen, mailSender)

		mediaRepo := pg.NewMediaRepository(pool)
		visitChecker := pg.NewVisitChecker(pool)
		travelLegRepo = pg.NewTravelLegRepository(pool)
		mediaHandler = media.NewHandler(mediaRepo, mediaStorage, tripChecker, visitChecker, pg.NewTravelLegChecker(pool))

		if os.Getenv("ENV") == "dev" {
			seedData(ctx, userRepo, tripRepo, stageRepo, visitRepo)
			log.Println("Seed data loaded")
		}
		log.Println("Using PostgreSQL storage")
	} else {
		// ── In-memory (dev without DB) ──
		tripRepo := memory.NewTripRepository()
		stageRepo := memory.NewStageRepository()
		visitRepo := memory.NewVisitRepository()
		tripChecker := memory.NewTripChecker(tripRepo)

		tripHandler = trip.NewHandler(tripRepo)
		stageHandler = stage.NewHandler(stageRepo, tripChecker, visitRepo)
		visitHandler = visit.NewHandler(visitRepo, tripChecker, stageRepo)

		userRepo := memory.NewUserRepository()
		sessionRepo := memory.NewSessionRepository()
		resetRepo := memory.NewPasswordResetRepository()
		authHandler = auth.NewHandler(userRepo, sessionRepo, resetRepo, hasher, tokenGen, mailSender)

		mediaRepo := memory.NewMediaRepository()
		visitChecker := memory.NewVisitChecker(visitRepo)
		travelLegRepo = memory.NewTravelLegRepository()
		mediaHandler = media.NewHandler(mediaRepo, mediaStorage, tripChecker, visitChecker, memory.NewTravelLegChecker(travelLegRepo))

		if os.Getenv("ENV") == "dev" {
			seedData(ctx, userRepo, tripRepo, stageRepo, visitRepo)
			log.Println("Seed data loaded")
		}
		log.Println("Using in-memory storage (set DATABASE_URL for PostgreSQL)")
	}

	// GraphQL
	resolver := graph.NewResolver(tripHandler, stageHandler, visitHandler, authHandler, mediaHandler)
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:5173"
	}

	if os.Getenv("ENV") == "dev" {
		http.Handle("/", playground.Handler("ShareMyTrips GraphQL", "/query"))
		log.Printf("GraphQL Playground available at http://localhost:%s/", port)
	}

	http.Handle("/query", corsMiddleware(corsOrigin, graph.AuthMiddleware(srv)))

	// Media REST endpoints
	mediaServing := mediahttp.NewMediaHandler(mediaHandler, mediaStorage, thumbnailer)
	http.Handle("/media/", corsMiddleware(corsOrigin, mediaServing))

	// Upload endpoint (requires an admin or editor session).
	userResolver := func(ctx context.Context, token string) (*auth.User, error) {
		return authHandler.GetCurrentUser(ctx, auth.GetCurrentUserQuery{Token: token})
	}
	uploadHandler := mediahttp.NewUploadHandler(mediaHandler, mediaStorage)
	http.Handle("/api/upload", corsMiddleware(corsOrigin, mediahttp.RequireEditor(userResolver, uploadHandler)))

	log.Printf("Server running at http://localhost:%s/query", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
