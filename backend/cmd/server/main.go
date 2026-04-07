package main

import (
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	graph "github.com/bfosses/sharemytrips/internal/graphql"
)

func main() {
	tripRepo := memory.NewTripRepository()
	stageRepo := memory.NewStageRepository()
	dayRepo := memory.NewDayRepository()
	tripChecker := memory.NewTripChecker(tripRepo)

	tripHandler := trip.NewHandler(tripRepo)
	stageHandler := stage.NewHandler(stageRepo, tripChecker, dayRepo)
	dayHandler := day.NewHandler(dayRepo, tripChecker)

	resolver := graph.NewResolver(tripHandler, stageHandler, dayHandler)

	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if os.Getenv("ENV") == "dev" {
		http.Handle("/", playground.Handler("ShareMyTrips GraphQL", "/query"))
		log.Printf("GraphQL Playground available at http://localhost:%s/", port)
	}

	http.Handle("/query", srv)

	log.Printf("Server running at http://localhost:%s/query", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
