package main

import (
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
	hasher := crypto.NewBcryptHasher(bcrypt.DefaultCost)
	tokenGen := &crypto.UUIDTokenGenerator{}

	resetURLBase := os.Getenv("RESET_URL_BASE")
	if resetURLBase == "" {
		resetURLBase = "http://localhost:5173/reset-password"
	}
	logMailer := mailer.NewLogMailer(resetURLBase)

	authHandler := auth.NewHandler(userRepo, sessionRepo, resetRepo, hasher, tokenGen, logMailer)

	// GraphQL
	resolver := graph.NewResolver(tripHandler, stageHandler, dayHandler, authHandler)
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if os.Getenv("ENV") == "dev" {
		http.Handle("/", playground.Handler("ShareMyTrips GraphQL", "/query"))
		log.Printf("GraphQL Playground available at http://localhost:%s/", port)
	}

	http.Handle("/query", graph.AuthMiddleware(srv))

	log.Printf("Server running at http://localhost:%s/query", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
