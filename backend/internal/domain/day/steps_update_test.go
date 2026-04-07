package day_test

import (
	"context"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

func registerUpdateSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^un jour "([^"]*)" existe dans l'étape$`, tc.dayExistsInStage)
	ctx.Step(`^je modifie le titre du jour avec "([^"]*)"$`, tc.updateDayTitle)
	ctx.Step(`^le jour est mis à jour avec le titre "([^"]*)"$`, tc.dayUpdatedWithTitle)
}

func (tc *testContext) dayExistsInStage(dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	created, err := tc.handler.Add(context.Background(), day.AddDayCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Date:    d,
		Title:   "Jour existant",
	})
	if err != nil {
		return fmt.Errorf("setup day: %w", err)
	}
	tc.currentDay = created
	return nil
}

func (tc *testContext) updateDayTitle(title string) error {
	updated, err := tc.handler.Update(context.Background(), day.UpdateDayCommand{
		ID:          tc.currentDay.ID,
		Title:       title,
		Description: tc.currentDay.Description,
	})
	tc.currentDay = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) dayUpdatedWithTitle(title string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentDay.Title != title {
		return fmt.Errorf("expected title %q, got %q", title, tc.currentDay.Title)
	}
	return nil
}
