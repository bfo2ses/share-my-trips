package day_test

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

func registerMultiStageSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je rattache le jour à l'étape "([^"]*)"$`, tc.attachDayToStage)
	ctx.Step(`^le jour apparaît dans l'étape "([^"]*)"$`, tc.dayAppearsInStage)
	ctx.Step(`^un jour "([^"]*)" est rattaché aux étapes "([^"]*)" et "([^"]*)"$`, tc.dayAttachedToTwoStages)
	ctx.Step(`^je détache le jour de l'étape "([^"]*)"$`, tc.detachDayFromStage)
	ctx.Step(`^le jour n'apparaît plus dans l'étape "([^"]*)"$`, tc.dayNotInStage)
	ctx.Step(`^le jour est conservé dans l'étape "([^"]*)"$`, tc.dayConservedInStage)
	ctx.Step(`^je tente de détacher le jour de sa seule étape$`, tc.tryDetachFromOnlyStage)
	ctx.Step(`^un message d'erreur m'indique qu'un jour doit appartenir à au moins une étape$`, tc.errMustBelongToStage)
	ctx.Step(`^je tente de rattacher le jour à l'étape de l'autre voyage$`, tc.attachDayToForeignStage)
}

func (tc *testContext) attachDayToStage(stageName string) error {
	stageID := "stage-" + stageName
	updated, err := tc.handler.AttachToStage(context.Background(), day.AttachToStageCommand{
		DayID:   tc.currentDay.ID,
		StageID: stageID,
	})
	tc.currentDay = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) dayAppearsInStage(stageName string) error {
	stageID := "stage-" + stageName
	days, err := tc.handler.ListByStage(context.Background(), day.ListByStageQuery{StageID: stageID})
	if err != nil {
		return err
	}
	for _, d := range days {
		if d.ID == tc.currentDay.ID {
			return nil
		}
	}
	return fmt.Errorf("day not found in stage %q", stageName)
}

func (tc *testContext) dayAttachedToTwoStages(dateStr, stage1Name, stage2Name string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	stage1ID := "stage-" + stage1Name
	stage2ID := "stage-" + stage2Name
	tc.secondStage = stage2ID
	tc.stageChecker.stagesInTrip[stage1ID] = tc.defaultTripID
	tc.stageChecker.stagesInTrip[stage2ID] = tc.defaultTripID

	created, err := tc.handler.Add(context.Background(), day.AddDayCommand{
		TripID:  tc.defaultTripID,
		StageID: stage1ID,
		Date:    d,
	})
	if err != nil {
		return fmt.Errorf("setup day: %w", err)
	}

	attached, err := tc.handler.AttachToStage(context.Background(), day.AttachToStageCommand{
		DayID:   created.ID,
		StageID: stage2ID,
	})
	if err != nil {
		return fmt.Errorf("setup attach: %w", err)
	}
	tc.currentDay = attached
	return nil
}

func (tc *testContext) detachDayFromStage(stageName string) error {
	stageID := "stage-" + stageName
	updated, err := tc.handler.DetachFromStage(context.Background(), day.DetachFromStageCommand{
		DayID:   tc.currentDay.ID,
		StageID: stageID,
	})
	tc.currentDay = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) dayNotInStage(stageName string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	stageID := "stage-" + stageName
	days, err := tc.handler.ListByStage(context.Background(), day.ListByStageQuery{StageID: stageID})
	if err != nil {
		return err
	}
	for _, d := range days {
		if d.ID == tc.currentDay.ID {
			return fmt.Errorf("day still found in stage %q", stageName)
		}
	}
	return nil
}

func (tc *testContext) dayConservedInStage(stageName string) error {
	stageID := "stage-" + stageName
	days, err := tc.handler.ListByStage(context.Background(), day.ListByStageQuery{StageID: stageID})
	if err != nil {
		return err
	}
	for _, d := range days {
		if d.ID == tc.currentDay.ID {
			return nil
		}
	}
	return fmt.Errorf("day not found in stage %q", stageName)
}

func (tc *testContext) tryDetachFromOnlyStage() error {
	updated, err := tc.handler.DetachFromStage(context.Background(), day.DetachFromStageCommand{
		DayID:   tc.currentDay.ID,
		StageID: tc.defaultStage,
	})
	tc.currentDay = updated
	tc.lastErr = err
	return nil
}

func (tc *testContext) errMustBelongToStage() error {
	if !errors.Is(tc.lastErr, day.ErrMustBelongToStage) {
		return fmt.Errorf("expected ErrMustBelongToStage, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) attachDayToForeignStage() error {
	updated, err := tc.handler.AttachToStage(context.Background(), day.AttachToStageCommand{
		DayID:   tc.currentDay.ID,
		StageID: tc.foreignStage,
	})
	tc.currentDay = updated
	tc.lastErr = err
	return nil
}
