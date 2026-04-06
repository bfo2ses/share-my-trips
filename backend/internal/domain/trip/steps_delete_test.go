package trip_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

func registerDeleteSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je supprime le voyage$`, tc.deleteTrip)
	ctx.Step(`^le voyage n\'existe plus$`, tc.tripNoLongerExists)
	ctx.Step(`^je tente de supprimer un voyage inexistant$`, tc.deleteNonExistentTrip)
	ctx.Step(`^un message d\'erreur m\'indique que le voyage n\'existe pas$`, tc.errTripNotFound)
}

func (tc *testContext) deleteTrip() error {
	tc.lastErr = tc.handler.Delete(context.Background(), trip.DeleteTripCommand{ID: tc.currentTrip.ID})
	return nil
}

func (tc *testContext) tripNoLongerExists() error {
	_, err := tc.handler.GetByID(context.Background(), trip.GetTripQuery{ID: tc.currentTrip.ID})
	if !errors.Is(err, trip.ErrNotFound) {
		return fmt.Errorf("expected trip to be deleted, got: %v", err)
	}
	return nil
}

func (tc *testContext) deleteNonExistentTrip() error {
	tc.lastErr = tc.handler.Delete(context.Background(), trip.DeleteTripCommand{ID: "non-existent"})
	return nil
}

func (tc *testContext) errTripNotFound() error {
	if !errors.Is(tc.lastErr, trip.ErrNotFound) {
		return fmt.Errorf("expected ErrNotFound, got: %v", tc.lastErr)
	}
	return nil
}
