package visit_test

import (
	"context"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

func registerListSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^l'étape contient les visites suivantes :$`, tc.stageContainsVisits)
	ctx.Step(`^les visites sont affichées dans l'ordre : "([^"]*)", "([^"]*)", "([^"]*)"$`, tc.visitsAreInOrder)
}

func (tc *testContext) stageContainsVisits(table *godog.Table) error {
	for _, row := range table.Rows[1:] {
		dateStr := row.Cells[0].Value
		title := row.Cells[1].Value

		d, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return fmt.Errorf("invalid date %q: %w", dateStr, err)
		}

		_, err = tc.handler.Add(context.Background(), visit.AddVisitCommand{
			TripID:  tc.defaultTripID,
			StageID: tc.defaultStage,
			Date:    d,
			Title:   title,
			Lat:     defaultLat,
			Lng:     defaultLng,
		})
		if err != nil {
			return fmt.Errorf("setup visit %q: %w", dateStr, err)
		}
	}
	return nil
}

func (tc *testContext) visitsAreInOrder(date1, date2, date3 string) error {
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: tc.defaultStage})
	if err != nil {
		return err
	}
	expected := []string{date1, date2, date3}
	if len(visits) != len(expected) {
		return fmt.Errorf("expected %d visits, got %d", len(expected), len(visits))
	}
	for i, v := range visits {
		dateStr := v.Date.Format("2006-01-02")
		if dateStr != expected[i] {
			return fmt.Errorf("visit %d: expected %q, got %q", i, expected[i], dateStr)
		}
	}
	return nil
}
