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
	"github.com/bfosses/sharemytrips/internal/adapter/mailer"
	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	graph "github.com/bfosses/sharemytrips/internal/graphql"
)

func corsMiddleware(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Trip / Stage / Day
	tripRepo := memory.NewTripRepository()
	stageRepo := memory.NewStageRepository()
	dayRepo := memory.NewDayRepository()
	tripChecker := memory.NewTripChecker(tripRepo)

	tripHandler := trip.NewHandler(tripRepo)
	stageHandler := stage.NewHandler(stageRepo, tripChecker, dayRepo)
	dayHandler := day.NewHandler(dayRepo, tripChecker, stageRepo)

	// Auth
	userRepo := memory.NewUserRepository()
	sessionRepo := memory.NewSessionRepository()
	resetRepo := memory.NewPasswordResetRepository()
	hasher, err := crypto.NewBcryptHasher(bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to create hasher: %v", err)
	}
	tokenGen := &crypto.UUIDTokenGenerator{}

	resetURLBase := os.Getenv("RESET_URL_BASE")
	if resetURLBase == "" {
		resetURLBase = "http://localhost:5173/reset-password"
	}
	logMailer := mailer.NewLogMailer(resetURLBase)

	authHandler := auth.NewHandler(userRepo, sessionRepo, resetRepo, hasher, tokenGen, logMailer)

	seedData(context.Background(), userRepo, tripRepo, stageRepo, dayRepo)

	// GraphQL
	resolver := graph.NewResolver(tripHandler, stageHandler, dayHandler, authHandler)
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

	log.Printf("Server running at http://localhost:%s/query", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
