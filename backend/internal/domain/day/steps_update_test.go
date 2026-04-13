package day_test

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

func registerUpdateSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^un jour "([^"]*)" existe dans l'étape$`, tc.dayExistsInStage)
	ctx.Step(`^je modifie le titre du jour avec "([^"]*)"$`, tc.updateDayTitle)
	ctx.Step(`^le jour est mis à jour avec le titre "([^"]*)"$`, tc.dayUpdatedWithTitle)
	ctx.Step(`^je modifie les coordonnées du jour en ([\-0-9.]+), ([\-0-9.]+)$`, tc.updateDayCoords)
	ctx.Step(`^je tente de modifier le jour sans coordonnées GPS$`, tc.updateDayWithoutGPS)
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
		Lat:     defaultLat,
		Lng:     defaultLng,
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
		Date:        tc.currentDay.Date,
		Title:       title,
		Description: tc.currentDay.Description,
		Lat:         tc.currentDay.Lat,
		Lng:         tc.currentDay.Lng,
	})
	if err == nil {
		tc.currentDay = updated
	}
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

func (tc *testContext) updateDayCoords(latStr, lngStr string) error {
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return fmt.Errorf("invalid latitude: %w", err)
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		return fmt.Errorf("invalid longitude: %w", err)
	}
	updated, err := tc.handler.Update(context.Background(), day.UpdateDayCommand{
		ID:          tc.currentDay.ID,
		Date:        tc.currentDay.Date,
		Title:       tc.currentDay.Title,
		Description: tc.currentDay.Description,
		Lat:         lat,
		Lng:         lng,
	})
	if err == nil {
		tc.currentDay = updated
	}
	tc.lastErr = err
	return nil
}

func (tc *testContext) updateDayWithoutGPS() error {
	_, err := tc.handler.Update(context.Background(), day.UpdateDayCommand{
		ID:          tc.currentDay.ID,
		Date:        tc.currentDay.Date,
		Title:       tc.currentDay.Title,
		Description: tc.currentDay.Description,
	})
	tc.lastErr = err
	return nil
}
