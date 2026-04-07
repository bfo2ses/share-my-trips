package day_test

import (
	"context"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

func registerListSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^l'étape contient les jours suivants :$`, tc.stageContainsDays)
	ctx.Step(`^les jours sont affichés dans l'ordre : "([^"]*)", "([^"]*)", "([^"]*)"$`, tc.daysAreInOrder)
}

func (tc *testContext) stageContainsDays(table *godog.Table) error {
	for _, row := range table.Rows[1:] {
		dateStr := row.Cells[0].Value
		title := row.Cells[1].Value

		d, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return fmt.Errorf("invalid date %q: %w", dateStr, err)
		}

		_, err = tc.handler.Add(context.Background(), day.AddDayCommand{
			TripID:  tc.defaultTripID,
			StageID: tc.defaultStage,
			Date:    d,
			Title:   title,
		})
		if err != nil {
			return fmt.Errorf("setup day %q: %w", dateStr, err)
		}
	}
	return nil
}

func (tc *testContext) daysAreInOrder(date1, date2, date3 string) error {
	days, err := tc.handler.ListByStage(context.Background(), day.ListByStageQuery{StageID: tc.defaultStage})
	if err != nil {
		return err
	}
	expected := []string{date1, date2, date3}
	if len(days) != len(expected) {
		return fmt.Errorf("expected %d days, got %d", len(expected), len(days))
	}
	for i, d := range days {
		dateStr := d.Date.Format("2006-01-02")
		if dateStr != expected[i] {
			return fmt.Errorf("day %d: expected %q, got %q", i, expected[i], dateStr)
		}
	}
	return nil
}
