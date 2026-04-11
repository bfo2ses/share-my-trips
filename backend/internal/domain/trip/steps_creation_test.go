package trip_test

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// defaultLat / defaultLng are used by tests that don't care about GPS values
// but still need valid (non-zero) coordinates to pass domain validation.
const (
	defaultLat = 64.1466
	defaultLng = -21.9426
)

func registerCreationSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je crée un nouveau voyage avec les informations suivantes :$`, tc.createTripWithDetails)
	ctx.Step(`^le voyage "([^"]*)" est créé avec le statut "([^"]*)"$`, tc.tripIsCreatedWithStatus)
	ctx.Step(`^les dates affichées sont du "([^"]*)" au "([^"]*)"$`, tc.datesAreFromTo)
	ctx.Step(`^le voyage apparaît dans ma liste de voyages$`, tc.tripAppearsInList)
	ctx.Step(`^je crée un voyage sans photo de couverture$`, tc.createTripWithoutCoverPhoto)
	ctx.Step(`^le voyage est créé avec une image par défaut$`, tc.tripHasDefaultCoverPhoto)
	ctx.Step(`^je tente de créer un voyage sans renseigner le pays$`, tc.createTripWithoutCountry)
	ctx.Step(`^je tente de créer un voyage sans renseigner le titre$`, tc.createTripWithoutTitle)
	ctx.Step(`^je tente de créer un voyage sans coordonnées GPS$`, tc.createTripWithoutGPS)
	ctx.Step(`^un message d\'erreur m\'indique que le pays est obligatoire$`, tc.errCountryRequired)
	ctx.Step(`^un message d\'erreur m\'indique que le titre est obligatoire$`, tc.errTitleRequired)
	ctx.Step(`^un message d\'erreur m\'indique que les coordonnées du voyage sont obligatoires$`, tc.errTripGPSRequired)
	ctx.Step(`^le voyage n\'est pas créé$`, tc.tripIsNotCreated)
	ctx.Step(`^je crée un voyage avec une date de fin antérieure à la date de début$`, tc.createTripWithEndBeforeStart)
	ctx.Step(`^un message d\'erreur m\'indique que les dates sont incohérentes$`, tc.errInvalidDates)
	ctx.Step(`^je crée un nouveau voyage$`, tc.createTrip)
	ctx.Step(`^son statut est "([^"]*)"$`, tc.tripStatusIs)
}

func (tc *testContext) createTripWithDetails(table *godog.Table) error {
	cmd := trip.CreateTripCommand{}

	for _, row := range table.Rows[1:] {
		field := row.Cells[0].Value
		value := row.Cells[1].Value

		switch field {
		case "titre":
			cmd.Title = value
		case "pays":
			cmd.Country = value
		case "latitude":
			v, err := strconv.ParseFloat(value, 64)
			if err != nil {
				return fmt.Errorf("invalid latitude: %w", err)
			}
			cmd.Lat = v
		case "longitude":
			v, err := strconv.ParseFloat(value, 64)
			if err != nil {
				return fmt.Errorf("invalid longitude: %w", err)
			}
			cmd.Lng = v
		case "date_debut":
			d, err := time.Parse("2006-01-02", value)
			if err != nil {
				return err
			}
			cmd.StartDate = d
		case "date_fin":
			d, err := time.Parse("2006-01-02", value)
			if err != nil {
				return err
			}
			cmd.EndDate = d
		case "description":
			cmd.Description = value
		case "photo_couverture":
			cmd.CoverPhoto = value
		}
	}

	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return nil
}

func (tc *testContext) tripIsCreatedWithStatus(title, status string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentTrip.Title != title {
		return fmt.Errorf("expected title %q, got %q", title, tc.currentTrip.Title)
	}
	expected := parseStatus(status)
	if tc.currentTrip.Status != expected {
		return fmt.Errorf("expected status %q, got %q", expected, tc.currentTrip.Status)
	}
	return nil
}

func (tc *testContext) datesAreFromTo(start, end string) error {
	s, _ := time.Parse("2006-01-02", start)
	e, _ := time.Parse("2006-01-02", end)
	if !tc.currentTrip.StartDate.Equal(s) {
		return fmt.Errorf("expected start %v, got %v", s, tc.currentTrip.StartDate)
	}
	if !tc.currentTrip.EndDate.Equal(e) {
		return fmt.Errorf("expected end %v, got %v", e, tc.currentTrip.EndDate)
	}
	return nil
}

func (tc *testContext) tripAppearsInList() error {
	trips, err := tc.handler.List(context.Background(), trip.ListTripsQuery{})
	if err != nil {
		return err
	}
	for _, t := range trips {
		if t.ID == tc.currentTrip.ID {
			return nil
		}
	}
	return fmt.Errorf("trip %q not found in list", tc.currentTrip.Title)
}

func (tc *testContext) createTripWithoutCoverPhoto() error {
	cmd := trip.CreateTripCommand{
		Title:     "Voyage sans photo",
		Country:   "France",
		Lat:       defaultLat,
		Lng:       defaultLng,
		StartDate: time.Date(2025, 6, 1, 0, 0, 0, 0, time.UTC),
		EndDate:   time.Date(2025, 6, 10, 0, 0, 0, 0, time.UTC),
	}
	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return nil
}

func (tc *testContext) tripHasDefaultCoverPhoto() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentTrip.CoverPhoto != "default_cover.jpg" {
		return fmt.Errorf("expected default cover, got %q", tc.currentTrip.CoverPhoto)
	}
	return nil
}

func (tc *testContext) createTripWithoutCountry() error {
	cmd := trip.CreateTripCommand{
		Title:     "Test",
		Lat:       defaultLat,
		Lng:       defaultLng,
		StartDate: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:   time.Date(2025, 1, 10, 0, 0, 0, 0, time.UTC),
	}
	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return nil
}

func (tc *testContext) createTripWithoutTitle() error {
	cmd := trip.CreateTripCommand{
		Country:   "France",
		Lat:       defaultLat,
		Lng:       defaultLng,
		StartDate: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:   time.Date(2025, 1, 10, 0, 0, 0, 0, time.UTC),
	}
	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return nil
}

func (tc *testContext) createTripWithoutGPS() error {
	cmd := trip.CreateTripCommand{
		Title:     "Voyage sans GPS",
		Country:   "France",
		StartDate: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:   time.Date(2025, 1, 10, 0, 0, 0, 0, time.UTC),
	}
	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return nil
}

func (tc *testContext) errTripGPSRequired() error {
	if !errors.Is(tc.lastErr, trip.ErrGPSRequired) {
		return fmt.Errorf("expected ErrGPSRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) errCountryRequired() error {
	if !errors.Is(tc.lastErr, trip.ErrCountryRequired) {
		return fmt.Errorf("expected ErrCountryRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) errTitleRequired() error {
	if !errors.Is(tc.lastErr, trip.ErrTitleRequired) {
		return fmt.Errorf("expected ErrTitleRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) tripIsNotCreated() error {
	if tc.currentTrip != nil {
		return fmt.Errorf("expected trip to be nil, got %+v", tc.currentTrip)
	}
	return nil
}

func (tc *testContext) createTripWithEndBeforeStart() error {
	cmd := trip.CreateTripCommand{
		Title:     "Test",
		Country:   "France",
		Lat:       defaultLat,
		Lng:       defaultLng,
		StartDate: time.Date(2025, 7, 14, 0, 0, 0, 0, time.UTC),
		EndDate:   time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC),
	}
	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return nil
}

func (tc *testContext) errInvalidDates() error {
	if !errors.Is(tc.lastErr, trip.ErrInvalidDates) {
		return fmt.Errorf("expected ErrInvalidDates, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) createTrip() error {
	cmd := trip.CreateTripCommand{
		Title:     "Nouveau voyage",
		Country:   "France",
		Lat:       defaultLat,
		Lng:       defaultLng,
		StartDate: time.Date(2025, 6, 1, 0, 0, 0, 0, time.UTC),
		EndDate:   time.Date(2025, 6, 10, 0, 0, 0, 0, time.UTC),
	}
	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return nil
}

func (tc *testContext) tripStatusIs(status string) error {
	expected := parseStatus(status)
	if tc.currentTrip.Status != expected {
		return fmt.Errorf("expected status %q, got %q", expected, tc.currentTrip.Status)
	}
	return nil
}
