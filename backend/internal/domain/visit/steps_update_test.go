package visit_test

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

func registerUpdateSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^une visite "([^"]*)" existe dans l'étape$`, tc.visitExistsInStage)
	ctx.Step(`^je modifie le titre de la visite avec "([^"]*)"$`, tc.updateVisitTitle)
	ctx.Step(`^la visite est mise à jour avec le titre "([^"]*)"$`, tc.visitUpdatedWithTitle)
	ctx.Step(`^je modifie les coordonnées de la visite en ([\-0-9.]+), ([\-0-9.]+)$`, tc.updateVisitCoords)
	ctx.Step(`^je tente de modifier la visite sans coordonnées GPS$`, tc.updateVisitWithoutGPS)
}

func (tc *testContext) visitExistsInStage(dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	created, err := tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Date:    d,
		Title:   "Visite existante",
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	if err != nil {
		return fmt.Errorf("setup visit: %w", err)
	}
	tc.currentVisit = created
	return nil
}

func (tc *testContext) updateVisitTitle(title string) error {
	updated, err := tc.handler.Update(context.Background(), visit.UpdateVisitCommand{
		ID:          tc.currentVisit.ID,
		Date:        tc.currentVisit.Date,
		Title:       title,
		Description: tc.currentVisit.Description,
		Lat:         tc.currentVisit.Lat,
		Lng:         tc.currentVisit.Lng,
	})
	if err == nil {
		tc.currentVisit = updated
	}
	tc.lastErr = err
	return nil
}

func (tc *testContext) visitUpdatedWithTitle(title string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentVisit.Title != title {
		return fmt.Errorf("expected title %q, got %q", title, tc.currentVisit.Title)
	}
	return nil
}

func (tc *testContext) updateVisitCoords(latStr, lngStr string) error {
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return fmt.Errorf("invalid latitude: %w", err)
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		return fmt.Errorf("invalid longitude: %w", err)
	}
	updated, err := tc.handler.Update(context.Background(), visit.UpdateVisitCommand{
		ID:          tc.currentVisit.ID,
		Date:        tc.currentVisit.Date,
		Title:       tc.currentVisit.Title,
		Description: tc.currentVisit.Description,
		Lat:         lat,
		Lng:         lng,
	})
	if err == nil {
		tc.currentVisit = updated
	}
	tc.lastErr = err
	return nil
}

func (tc *testContext) updateVisitWithoutGPS() error {
	_, err := tc.handler.Update(context.Background(), visit.UpdateVisitCommand{
		ID:          tc.currentVisit.ID,
		Date:        tc.currentVisit.Date,
		Title:       tc.currentVisit.Title,
		Description: tc.currentVisit.Description,
	})
	tc.lastErr = err
	return nil
}
