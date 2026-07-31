package visit_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

func registerDeleteSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je supprime la visite$`, tc.deleteVisit)
	ctx.Step(`^la visite n'existe plus$`, tc.visitNoLongerExists)
}

func (tc *testContext) deleteVisit() error {
	tc.lastErr = tc.handler.Delete(context.Background(), visit.DeleteVisitCommand{ID: tc.currentVisit.ID})
	return nil
}

func (tc *testContext) visitNoLongerExists() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	_, err := tc.handler.GetByID(context.Background(), visit.GetVisitQuery{ID: tc.currentVisit.ID})
	if !errors.Is(err, visit.ErrNotFound) {
		return fmt.Errorf("expected visit to be deleted, got: %v", err)
	}
	return nil
}
