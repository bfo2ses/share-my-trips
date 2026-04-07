package stage_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
)

func registerUpdateSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^une étape "([^"]*)" existe dans le voyage$`, tc.stageExistsInTrip)
	ctx.Step(`^je modifie la description de l'étape avec "([^"]*)"$`, tc.updateStageDescription)
	ctx.Step(`^l'étape est mise à jour avec la description "([^"]*)"$`, tc.stageUpdatedWithDescription)
	ctx.Step(`^un voyage "([^"]*)" est clôturé$`, tc.tripIsClosed)
	ctx.Step(`^une étape "([^"]*)" existe dans le voyage "([^"]*)"$`, tc.stageExistsInNamedTrip)
	ctx.Step(`^je tente de modifier l'étape "([^"]*)"$`, tc.tryUpdateStage)
	ctx.Step(`^un message d'erreur m'indique que le voyage est clôturé$`, tc.errTripClosed)
}

func (tc *testContext) stageExistsInTrip(city string) error {
	s, err := tc.handler.Add(context.Background(), stage.AddStageCommand{
		TripID: tc.defaultTripID,
		City:   city,
		Lat:    64.1466,
		Lng:    -21.9426,
	})
	if err != nil {
		return fmt.Errorf("setup stage: %w", err)
	}
	tc.currentStage = s
	return nil
}

func (tc *testContext) updateStageDescription(description string) error {
	updated, err := tc.handler.Update(context.Background(), stage.UpdateStageCommand{
		ID:          tc.currentStage.ID,
		City:        tc.currentStage.City,
		Name:        tc.currentStage.Name,
		Lat:         tc.currentStage.Lat,
		Lng:         tc.currentStage.Lng,
		Description: description,
	})
	tc.currentStage = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) stageUpdatedWithDescription(description string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentStage.Description != description {
		return fmt.Errorf("expected description %q, got %q", description, tc.currentStage.Description)
	}
	return nil
}

func (tc *testContext) tripIsClosed(name string) error {
	_ = name
	tc.tripChecker.closedTripIDs[tc.closedTripID] = true
	return nil
}

func (tc *testContext) stageExistsInNamedTrip(city, _ string) error {
	s, err := tc.handler.Add(context.Background(), stage.AddStageCommand{
		TripID: tc.defaultTripID,
		City:   city,
		Lat:    35.6762,
		Lng:    139.6503,
	})
	if err != nil {
		return fmt.Errorf("setup stage: %w", err)
	}
	// Re-assign to the closed trip.
	s.TripID = tc.closedTripID
	if err := tc.repo.Save(context.Background(), s); err != nil {
		return err
	}
	tc.currentStage = s
	return nil
}

func (tc *testContext) tryUpdateStage(_ string) error {
	updated, err := tc.handler.Update(context.Background(), stage.UpdateStageCommand{
		ID:   tc.currentStage.ID,
		City: tc.currentStage.City,
		Lat:  tc.currentStage.Lat,
		Lng:  tc.currentStage.Lng,
	})
	tc.currentStage = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) errTripClosed() error {
	if !errors.Is(tc.lastErr, stage.ErrTripClosed) {
		return fmt.Errorf("expected ErrTripClosed, got: %v", tc.lastErr)
	}
	return nil
}
