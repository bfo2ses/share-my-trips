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
	"github.com/bfosses/sharemytrips/migrations"
	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	graph "github.com/bfosses/sharemytrips/internal/graphql"
	mediahttp "github.com/bfosses/sharemytrips/internal/http"
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
	var dayHandler *day.Handler
	var authHandler *auth.Handler
	var mediaHandler *media.Handler

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
		dayRepo := pg.NewDayRepository(pool)
		tripChecker := pg.NewTripChecker(pool)

		tripHandler = trip.NewHandler(tripRepo)
		stageHandler = stage.NewHandler(stageRepo, tripChecker, dayRepo)
		dayHandler = day.NewHandler(dayRepo, tripChecker, stageRepo)

		userRepo := pg.NewUserRepository(pool)
		sessionRepo := pg.NewSessionRepository(pool)
		resetRepo := pg.NewResetRepository(pool)
		authHandler = auth.NewHandler(userRepo, sessionRepo, resetRepo, hasher, tokenGen, mailSender)

		mediaRepo := pg.NewMediaRepository(pool)
		dayChecker := pg.NewDayChecker(pool)
		mediaHandler = media.NewHandler(mediaRepo, mediaStorage, tripChecker, dayChecker)

		seedData(ctx, userRepo, tripRepo, stageRepo, dayRepo)
		log.Println("Using PostgreSQL storage")
	} else {
		// ── In-memory (dev without DB) ──
		tripRepo := memory.NewTripRepository()
		stageRepo := memory.NewStageRepository()
		dayRepo := memory.NewDayRepository()
		tripChecker := memory.NewTripChecker(tripRepo)

		tripHandler = trip.NewHandler(tripRepo)
		stageHandler = stage.NewHandler(stageRepo, tripChecker, dayRepo)
		dayHandler = day.NewHandler(dayRepo, tripChecker, stageRepo)

		userRepo := memory.NewUserRepository()
		sessionRepo := memory.NewSessionRepository()
		resetRepo := memory.NewPasswordResetRepository()
		authHandler = auth.NewHandler(userRepo, sessionRepo, resetRepo, hasher, tokenGen, mailSender)

		mediaRepo := memory.NewMediaRepository()
		dayChecker := memory.NewDayChecker(dayRepo)
		mediaHandler = media.NewHandler(mediaRepo, mediaStorage, tripChecker, dayChecker)

		seedData(ctx, userRepo, tripRepo, stageRepo, dayRepo)
		log.Println("Using in-memory storage (set DATABASE_URL for PostgreSQL)")
	}

	// GraphQL
	resolver := graph.NewResolver(tripHandler, stageHandler, dayHandler, authHandler, mediaHandler)
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

	// Upload endpoint (requires auth).
	tokenResolver := func(token string) (string, error) {
		user, err := authHandler.GetCurrentUser(context.Background(), auth.GetCurrentUserQuery{Token: token})
		if err != nil {
			return "", err
		}
		return user.ID, nil
	}
	uploadHandler := mediahttp.NewUploadHandler(mediaHandler, mediaStorage)
	http.Handle("/api/upload", corsMiddleware(corsOrigin, mediahttp.RequireAuth(tokenResolver, uploadHandler)))

	log.Printf("Server running at http://localhost:%s/query", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
