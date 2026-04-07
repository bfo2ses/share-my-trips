package day_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

func registerDeleteSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je supprime le jour$`, tc.deleteDay)
	ctx.Step(`^le jour n'existe plus$`, tc.dayNoLongerExists)
}

func (tc *testContext) deleteDay() error {
	tc.lastErr = tc.handler.Delete(context.Background(), day.DeleteDayCommand{ID: tc.currentDay.ID})
	return nil
}

func (tc *testContext) dayNoLongerExists() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	_, err := tc.handler.GetByID(context.Background(), day.GetDayQuery{ID: tc.currentDay.ID})
	if !errors.Is(err, day.ErrNotFound) {
		return fmt.Errorf("expected day to be deleted, got: %v", err)
	}
	return nil
}
