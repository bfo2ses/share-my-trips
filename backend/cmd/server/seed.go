package main

import (
	"context"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

func seedData(
	ctx context.Context,
	userRepo *memory.UserRepository,
	tripRepo *memory.TripRepository,
	stageRepo *memory.StageRepository,
	dayRepo *memory.DayRepository,
) {
	hash, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("seed: bcrypt: %v", err)
	}
	admin, _ := auth.NewUser("user-1", "Benjamin", "admin@sharemytrips.com", string(hash), auth.RoleAdmin)
	_ = userRepo.Save(ctx, admin)

	// Trip 1 : Road Trip USA — published
	t1, _ := trip.NewTrip(
		"trip-1", "Road Trip USA", "États-Unis",
		"3 semaines sur la côte ouest, de San Francisco à Los Angeles.",
		"default_cover.jpg",
		time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC),
		time.Date(2024, 7, 21, 0, 0, 0, 0, time.UTC),
	)
	_ = t1.Publish()
	_ = tripRepo.Save(ctx, t1)

	sf, _ := stage.NewStage("stage-1-1", "trip-1", "San Francisco", "San Francisco", 37.7749, -122.4194, "Point de départ : la baie de SF et le Golden Gate.")
	la, _ := stage.NewStage("stage-1-2", "trip-1", "Los Angeles", "Los Angeles", 34.0522, -118.2437, "Dernière étape : Hollywood, Santa Monica et Venice Beach.")
	vegas, _ := stage.NewStage("stage-1-3", "trip-1", "Las Vegas", "Las Vegas", 36.1699, -115.1398, "Un détour par le désert du Nevada.")
	_ = stageRepo.Save(ctx, sf)
	_ = stageRepo.Save(ctx, la)
	_ = stageRepo.Save(ctx, vegas)

	trip1Days := []struct {
		id, stageID, title, desc string
		date                     time.Time
	}{
		{"day-1-1", "stage-1-1", "Arrivée à San Francisco", "Vol San Francisco. Installation à l'hôtel dans le quartier Mission.", time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)},
		{"day-1-2", "stage-1-1", "Golden Gate & Alcatraz", "Visite du Golden Gate Bridge et tour en bateau jusqu'à Alcatraz.", time.Date(2024, 7, 2, 0, 0, 0, 0, time.UTC)},
		{"day-1-3", "stage-1-3", "Route vers Las Vegas", "Départ de SF, traversée de la Vallée de la Mort.", time.Date(2024, 7, 5, 0, 0, 0, 0, time.UTC)},
		{"day-1-4", "stage-1-3", "Las Vegas by night", "Le Strip illuminé, spectacles et buffets à volonté.", time.Date(2024, 7, 6, 0, 0, 0, 0, time.UTC)},
		{"day-1-5", "stage-1-2", "Santa Monica & Venice Beach", "Arrivée à LA, détente sur les plages.", time.Date(2024, 7, 10, 0, 0, 0, 0, time.UTC)},
		{"day-1-6", "stage-1-2", "Hollywood & Griffith", "Balade sur le Hollywood Walk of Fame et vue depuis Griffith Observatory.", time.Date(2024, 7, 11, 0, 0, 0, 0, time.UTC)},
	}
	for _, d := range trip1Days {
		nd, _ := day.NewDay(d.id, "trip-1", d.stageID, d.date, d.title, d.desc)
		_ = dayRepo.Save(ctx, nd)
	}

	// Trip 2 : Voyage au Japon — closed
	t2, _ := trip.NewTrip(
		"trip-2", "Voyage au Japon", "Japon",
		"Deux semaines entre Tokyo, Kyoto et Osaka.",
		"default_cover.jpg",
		time.Date(2023, 10, 5, 0, 0, 0, 0, time.UTC),
		time.Date(2023, 10, 19, 0, 0, 0, 0, time.UTC),
	)
	_ = t2.Publish()
	_ = tripRepo.Save(ctx, t2)

	tokyo, _ := stage.NewStage("stage-2-1", "trip-2", "Tokyo", "Tokyo", 35.6762, 139.6503, "La capitale : Shibuya, Akihabara, Senso-ji.")
	kyoto, _ := stage.NewStage("stage-2-2", "trip-2", "Kyoto", "Kyoto", 35.0116, 135.7681, "Temples et jardins zen.")
	osaka, _ := stage.NewStage("stage-2-3", "trip-2", "Osaka", "Osaka", 34.6937, 135.5023, "Street food et Dotonbori.")
	_ = stageRepo.Save(ctx, tokyo)
	_ = stageRepo.Save(ctx, kyoto)
	_ = stageRepo.Save(ctx, osaka)

	trip2Days := []struct {
		id, stageID, title, desc string
		date                     time.Time
	}{
		{"day-2-1", "stage-2-1", "Arrivée à Tokyo", "Atterrissage à Narita, direction Shinjuku.", time.Date(2023, 10, 5, 0, 0, 0, 0, time.UTC)},
		{"day-2-2", "stage-2-1", "Shibuya & Harajuku", "Le fameux carrefour de Shibuya et la rue Takeshita.", time.Date(2023, 10, 6, 0, 0, 0, 0, time.UTC)},
		{"day-2-3", "stage-2-1", "Senso-ji & Akihabara", "Temple bouddhiste d'Asakusa et quartier électronique.", time.Date(2023, 10, 7, 0, 0, 0, 0, time.UTC)},
		{"day-2-4", "stage-2-2", "Arrivée à Kyoto", "Shinkansen depuis Tokyo, premier temple dès l'arrivée.", time.Date(2023, 10, 10, 0, 0, 0, 0, time.UTC)},
		{"day-2-5", "stage-2-2", "Fushimi Inari", "Les mille torii oranges au lever du soleil.", time.Date(2023, 10, 11, 0, 0, 0, 0, time.UTC)},
		{"day-2-6", "stage-2-3", "Osaka Food Tour", "Takoyaki, okonomiyaki et ramen dans le quartier Dotonbori.", time.Date(2023, 10, 15, 0, 0, 0, 0, time.UTC)},
		{"day-2-7", "stage-2-3", "Château d'Osaka", "Visite du château et parc environnant.", time.Date(2023, 10, 16, 0, 0, 0, 0, time.UTC)},
	}
	for _, d := range trip2Days {
		nd, _ := day.NewDay(d.id, "trip-2", d.stageID, d.date, d.title, d.desc)
		_ = dayRepo.Save(ctx, nd)
	}

	t2saved, _ := tripRepo.FindByID(ctx, "trip-2")
	_ = t2saved.Close(
		time.Date(2023, 10, 5, 0, 0, 0, 0, time.UTC),
		time.Date(2023, 10, 19, 0, 0, 0, 0, time.UTC),
	)
	_ = tripRepo.Save(ctx, t2saved)

	// Trip 3 : Road Trip Islande — draft
	t3, _ := trip.NewTrip(
		"trip-3", "Road Trip Islande", "Islande",
		"Tour de l'île en van sur la route 1.",
		"default_cover.jpg",
		time.Date(2025, 6, 15, 0, 0, 0, 0, time.UTC),
		time.Date(2025, 6, 29, 0, 0, 0, 0, time.UTC),
	)
	_ = tripRepo.Save(ctx, t3)

	reykjavik, _ := stage.NewStage("stage-3-1", "trip-3", "Reykjavik", "Reykjavik", 64.1466, -21.9426, "La capitale, point de départ du van trip.")
	akureyri, _ := stage.NewStage("stage-3-2", "trip-3", "Akureyri", "Akureyri", 65.6835, -18.0878, "La capitale du nord, au bord du fjord Eyjafjörður.")
	_ = stageRepo.Save(ctx, reykjavik)
	_ = stageRepo.Save(ctx, akureyri)

	log.Println("seed: data loaded (admin@sharemytrips.com / password)")
}
