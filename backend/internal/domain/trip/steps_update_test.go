package trip_test

import (
	"context"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

func registerUpdateSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je modifie le titre en "([^"]*)"$`, tc.updateTitle)
	ctx.Step(`^le voyage est mis à jour avec le nouveau titre "([^"]*)"$`, tc.tripTitleIsUpdated)
	ctx.Step(`^je remplace la photo de couverture par "([^"]*)"$`, tc.updateCoverPhoto)
	ctx.Step(`^la photo de couverture est "([^"]*)"$`, tc.coverPhotoIs)
	ctx.Step(`^je modifie le pays en "([^"]*)"$`, tc.updateCountry)
	ctx.Step(`^le pays du voyage est "([^"]*)"$`, tc.countryIs)
}

func (tc *testContext) updateTitle(newTitle string) error {
	tc.currentTrip, tc.lastErr = tc.handler.Update(context.Background(), trip.UpdateTripCommand{
		ID:        tc.currentTrip.ID,
		Title:     newTitle,
		Country:   tc.currentTrip.Country,
		StartDate: tc.currentTrip.StartDate,
		EndDate:   tc.currentTrip.EndDate,
	})
	return nil
}

func (tc *testContext) tripTitleIsUpdated(title string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentTrip.Title != title {
		return fmt.Errorf("expected title %q, got %q", title, tc.currentTrip.Title)
	}
	return nil
}

func (tc *testContext) updateCoverPhoto(photo string) error {
	tc.currentTrip, tc.lastErr = tc.handler.Update(context.Background(), trip.UpdateTripCommand{
		ID:         tc.currentTrip.ID,
		Title:      tc.currentTrip.Title,
		Country:    tc.currentTrip.Country,
		CoverPhoto: photo,
		StartDate:  tc.currentTrip.StartDate,
		EndDate:    tc.currentTrip.EndDate,
	})
	return nil
}

func (tc *testContext) coverPhotoIs(photo string) error {
	if tc.currentTrip.CoverPhoto != photo {
		return fmt.Errorf("expected cover %q, got %q", photo, tc.currentTrip.CoverPhoto)
	}
	return nil
}

func (tc *testContext) updateCountry(country string) error {
	tc.currentTrip, tc.lastErr = tc.handler.Update(context.Background(), trip.UpdateTripCommand{
		ID:        tc.currentTrip.ID,
		Title:     tc.currentTrip.Title,
		Country:   country,
		StartDate: tc.currentTrip.StartDate,
		EndDate:   tc.currentTrip.EndDate,
	})
	return nil
}

func (tc *testContext) countryIs(country string) error {
	if tc.currentTrip.Country != country {
		return fmt.Errorf("expected country %q, got %q", country, tc.currentTrip.Country)
	}
	return nil
}
