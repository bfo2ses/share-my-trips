package visit_test

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

func registerMultiStageSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je rattache la visite à l'étape "([^"]*)"$`, tc.attachVisitToStage)
	ctx.Step(`^la visite apparaît dans l'étape "([^"]*)"$`, tc.visitAppearsInStage)
	ctx.Step(`^une visite "([^"]*)" est rattachée aux étapes "([^"]*)" et "([^"]*)"$`, tc.visitAttachedToTwoStages)
	ctx.Step(`^je détache la visite de l'étape "([^"]*)"$`, tc.detachVisitFromStage)
	ctx.Step(`^la visite n'apparaît plus dans l'étape "([^"]*)"$`, tc.visitNotInStage)
	ctx.Step(`^la visite est conservée dans l'étape "([^"]*)"$`, tc.visitConservedInStage)
	ctx.Step(`^je tente de détacher la visite de sa seule étape$`, tc.tryDetachFromOnlyStage)
	ctx.Step(`^un message d'erreur m'indique qu'une visite doit appartenir à au moins une étape$`, tc.errMustBelongToStage)
	ctx.Step(`^je tente de rattacher la visite à l'étape de l'autre voyage$`, tc.attachVisitToForeignStage)
}

func (tc *testContext) attachVisitToStage(stageName string) error {
	stageID := "stage-" + stageName
	updated, err := tc.handler.AttachToStage(context.Background(), visit.AttachToStageCommand{
		VisitID: tc.currentVisit.ID,
		StageID: stageID,
	})
	tc.currentVisit = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) visitAppearsInStage(stageName string) error {
	stageID := "stage-" + stageName
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: stageID})
	if err != nil {
		return err
	}
	for _, v := range visits {
		if v.ID == tc.currentVisit.ID {
			return nil
		}
	}
	return fmt.Errorf("visit not found in stage %q", stageName)
}

func (tc *testContext) visitAttachedToTwoStages(dateStr, stage1Name, stage2Name string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	stage1ID := "stage-" + stage1Name
	stage2ID := "stage-" + stage2Name
	tc.secondStage = stage2ID
	tc.stageChecker.stagesInTrip[stage1ID] = tc.defaultTripID
	tc.stageChecker.stagesInTrip[stage2ID] = tc.defaultTripID

	created, err := tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: stage1ID,
		Date:    d,
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	if err != nil {
		return fmt.Errorf("setup visit: %w", err)
	}

	attached, err := tc.handler.AttachToStage(context.Background(), visit.AttachToStageCommand{
		VisitID: created.ID,
		StageID: stage2ID,
	})
	if err != nil {
		return fmt.Errorf("setup attach: %w", err)
	}
	tc.currentVisit = attached
	return nil
}

func (tc *testContext) detachVisitFromStage(stageName string) error {
	stageID := "stage-" + stageName
	updated, err := tc.handler.DetachFromStage(context.Background(), visit.DetachFromStageCommand{
		VisitID: tc.currentVisit.ID,
		StageID: stageID,
	})
	tc.currentVisit = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) visitNotInStage(stageName string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	stageID := "stage-" + stageName
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: stageID})
	if err != nil {
		return err
	}
	for _, v := range visits {
		if v.ID == tc.currentVisit.ID {
			return fmt.Errorf("visit still found in stage %q", stageName)
		}
	}
	return nil
}

func (tc *testContext) visitConservedInStage(stageName string) error {
	stageID := "stage-" + stageName
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: stageID})
	if err != nil {
		return err
	}
	for _, v := range visits {
		if v.ID == tc.currentVisit.ID {
			return nil
		}
	}
	return fmt.Errorf("visit not found in stage %q", stageName)
}

func (tc *testContext) tryDetachFromOnlyStage() error {
	updated, err := tc.handler.DetachFromStage(context.Background(), visit.DetachFromStageCommand{
		VisitID: tc.currentVisit.ID,
		StageID: tc.defaultStage,
	})
	tc.currentVisit = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) errMustBelongToStage() error {
	if !errors.Is(tc.lastErr, visit.ErrMustBelongToStage) {
		return fmt.Errorf("expected ErrMustBelongToStage, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) attachVisitToForeignStage() error {
	updated, err := tc.handler.AttachToStage(context.Background(), visit.AttachToStageCommand{
		VisitID: tc.currentVisit.ID,
		StageID: tc.foreignStage,
	})
	tc.currentVisit = updated
	tc.lastErr = err
	return nil
}
