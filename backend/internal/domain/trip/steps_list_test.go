package trip_test

import (
	"context"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

func registerListSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^les voyages suivants existent :$`, tc.tripsExist)
	ctx.Step(`^les voyages sont affichés dans l\'ordre "([^"]*)", "([^"]*)", "([^"]*)"$`, tc.tripsAreDisplayedInOrder)
}

func (tc *testContext) tripsExist(table *godog.Table) error {
	for _, row := range table.Rows[1:] {
		title := row.Cells[0].Value
		dateStr := row.Cells[1].Value
		d, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return err
		}
		cmd := trip.CreateTripCommand{
			Title:     title,
			Country:   "Pays",
			StartDate: d,
			EndDate:   d.AddDate(0, 0, 14),
		}
		if _, err := tc.handler.Create(context.Background(), cmd); err != nil {
			return err
		}
	}
	return nil
}

func (tc *testContext) tripsAreDisplayedInOrder(first, second, third string) error {
	trips, err := tc.handler.List(context.Background(), trip.ListTripsQuery{})
	if err != nil {
		return err
	}

	expected := []string{first, second, third}

	if len(trips) != len(expected) {
		return fmt.Errorf("expected %d trips, got %d", len(expected), len(trips))
	}
	for i, t := range trips {
		if t.Title != expected[i] {
			return fmt.Errorf("at position %d: expected %q, got %q", i, expected[i], t.Title)
		}
	}
	return nil
}
