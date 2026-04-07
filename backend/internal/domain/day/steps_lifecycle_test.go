package day_test

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

func registerLifecycleSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^un voyage "([^"]*)" est clôturé$`, tc.tripIsClosed)
	ctx.Step(`^je tente d'ajouter un jour au voyage clôturé$`, tc.addDayToClosedTrip)
	ctx.Step(`^un message d'erreur m'indique que le voyage est clôturé pour les jours$`, tc.errTripClosed)
	ctx.Step(`^un jour "([^"]*)" existe dans le voyage clôturé$`, tc.dayExistsInClosedTrip)
	ctx.Step(`^je tente de modifier le jour du voyage clôturé$`, tc.updateDayInClosedTrip)
}

func (tc *testContext) tripIsClosed(_ string) error {
	tc.tripChecker.closedTripIDs["trip-japan"] = true
	return nil
}

func (tc *testContext) addDayToClosedTrip() error {
	tc.currentDay, tc.lastErr = tc.handler.Add(context.Background(), day.AddDayCommand{
		TripID:  "trip-japan",
		StageID: tc.defaultStage,
		Date:    time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC),
	})
	return nil
}

func (tc *testContext) errTripClosed() error {
	if !errors.Is(tc.lastErr, day.ErrTripClosed) {
		return fmt.Errorf("expected ErrTripClosed, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) dayExistsInClosedTrip(dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	// Bypass trip check: create directly via open trip, then reassign to closed trip.
	created, err := tc.handler.Add(context.Background(), day.AddDayCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Date:    d,
	})
	if err != nil {
		return fmt.Errorf("setup day: %w", err)
	}
	// Overwrite TripID in the repo to simulate a day belonging to a closed trip.
	created.TripID = "trip-japan"
	if err := tc.repo.Save(context.Background(), created); err != nil {
		return err
	}
	tc.currentDay = created
	return nil
}

func (tc *testContext) updateDayInClosedTrip() error {
	updated, err := tc.handler.Update(context.Background(), day.UpdateDayCommand{
		ID:    tc.currentDay.ID,
		Title: "Titre modifié",
	})
	tc.currentDay = updated
	tc.lastErr = err
	return nil
}
