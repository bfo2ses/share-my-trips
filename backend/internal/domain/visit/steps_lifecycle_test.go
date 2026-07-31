package visit_test

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

func registerLifecycleSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^un voyage "([^"]*)" est clôturé$`, tc.tripIsClosed)
	ctx.Step(`^je tente d'ajouter une visite au voyage clôturé$`, tc.addVisitToClosedTrip)
	ctx.Step(`^un message d'erreur m'indique que le voyage est clôturé pour les visites$`, tc.errTripClosed)
	ctx.Step(`^une visite "([^"]*)" existe dans le voyage clôturé$`, tc.visitExistsInClosedTrip)
	ctx.Step(`^je tente de modifier la visite du voyage clôturé$`, tc.updateVisitInClosedTrip)
}

func (tc *testContext) tripIsClosed(_ string) error {
	tc.tripChecker.closedTripIDs["trip-japan"] = true
	return nil
}

func (tc *testContext) addVisitToClosedTrip() error {
	tc.currentVisit, tc.lastErr = tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  "trip-japan",
		StageID: tc.defaultStage,
		Date:    time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC),
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	return nil
}

func (tc *testContext) errTripClosed() error {
	if !errors.Is(tc.lastErr, visit.ErrTripClosed) {
		return fmt.Errorf("expected ErrTripClosed, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) visitExistsInClosedTrip(dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	// Bypass trip check: create directly via open trip, then reassign to closed trip.
	created, err := tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Date:    d,
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	if err != nil {
		return fmt.Errorf("setup visit: %w", err)
	}
	// Overwrite TripID in the repo to simulate a visit belonging to a closed trip.
	created.TripID = "trip-japan"
	if err := tc.repo.Save(context.Background(), created); err != nil {
		return err
	}
	tc.currentVisit = created
	return nil
}

func (tc *testContext) updateVisitInClosedTrip() error {
	updated, err := tc.handler.Update(context.Background(), visit.UpdateVisitCommand{
		ID:    tc.currentVisit.ID,
		Date:  tc.currentVisit.Date,
		Title: "Titre modifié",
		Lat:   tc.currentVisit.Lat,
		Lng:   tc.currentVisit.Lng,
	})
	tc.currentVisit = updated
	tc.lastErr = err
	return nil
}
