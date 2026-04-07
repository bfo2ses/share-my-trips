package stage_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
)

func registerDeleteSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je supprime l'étape "([^"]*)"$`, tc.deleteStage)
	ctx.Step(`^l'étape n'existe plus$`, tc.stageNoLongerExists)
	ctx.Step(`^je tente de supprimer l'étape "([^"]*)"$`, tc.tryDeleteStage)
}

func (tc *testContext) tryDeleteStage(_ string) error {
	tc.lastErr = tc.handler.Delete(context.Background(), stage.DeleteStageCommand{ID: tc.currentStage.ID})
	return nil
}

func (tc *testContext) deleteStage(_ string) error {
	tc.lastErr = tc.handler.Delete(context.Background(), stage.DeleteStageCommand{ID: tc.currentStage.ID})
	return nil
}

func (tc *testContext) stageNoLongerExists() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	_, err := tc.handler.GetByID(context.Background(), stage.GetStageQuery{ID: tc.currentStage.ID})
	if !errors.Is(err, stage.ErrNotFound) {
		return fmt.Errorf("expected stage to be deleted, got: %v", err)
	}
	// Verify that DetachStage was called to cascade the deletion.
	for _, id := range tc.dayDetacher.detachedStageIDs {
		if id == tc.currentStage.ID {
			return nil
		}
	}
	return fmt.Errorf("expected DetachStage to be called for stage %q", tc.currentStage.ID)
}
