package visit_test

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// defaultLat / defaultLng are used by tests that don't care about GPS values
// but still need valid (non-zero) coordinates to pass domain validation.
const (
	defaultLat = 64.1466
	defaultLng = -21.9426
)

func registerCreationSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^un voyage "([^"]*)" existe et n'est pas clôturé$`, tc.tripExistsAndOpen)
	ctx.Step(`^une étape "([^"]*)" existe dans le voyage$`, tc.stageExistsInTrip)
	ctx.Step(`^j'ajoute une visite avec les informations suivantes :$`, tc.addVisitWithDetails)
	ctx.Step(`^la visite est ajoutée à l'étape$`, tc.visitIsAdded)
	ctx.Step(`^la date de la visite est "([^"]*)"$`, tc.visitDateIs)
	ctx.Step(`^les coordonnées de la visite sont ([\-0-9.]+), ([\-0-9.]+)$`, tc.visitCoordsAre)
	ctx.Step(`^je tente d'ajouter une visite sans date$`, tc.addVisitWithoutDate)
	ctx.Step(`^je tente d'ajouter une visite sans coordonnées GPS$`, tc.addVisitWithoutGPS)
	ctx.Step(`^un message d'erreur m'indique que la date est obligatoire$`, tc.errDateRequired)
	ctx.Step(`^un message d'erreur m'indique que les coordonnées de la visite sont obligatoires$`, tc.errVisitGPSRequired)
	ctx.Step(`^la visite n'est pas créée$`, tc.visitIsNotCreated)
	ctx.Step(`^une étape "([^"]*)" appartient à un autre voyage$`, tc.stageExistsInAnotherTrip)
	ctx.Step(`^je tente d'ajouter une visite avec l'étape de l'autre voyage$`, tc.addVisitWithForeignStage)
	ctx.Step(`^un message d'erreur m'indique que l'étape n'appartient pas au voyage$`, tc.errStageNotInTrip)
}

func (tc *testContext) tripExistsAndOpen(_ string) error {
	return nil
}

func (tc *testContext) stageExistsInTrip(city string) error {
	stageID := "stage-" + city
	// First call (Contexte) sets defaultStage; subsequent calls set secondStage.
	if tc.defaultStage == "" {
		tc.defaultStage = stageID
	} else {
		tc.secondStage = stageID
	}
	tc.stageChecker.stagesInTrip[stageID] = tc.defaultTripID
	return nil
}

func (tc *testContext) addVisitWithDetails(table *godog.Table) error {
	cmd := visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
	}

	for _, row := range table.Rows[1:] {
		field := row.Cells[0].Value
		value := row.Cells[1].Value

		switch field {
		case "date":
			d, err := time.Parse("2006-01-02", value)
			if err != nil {
				return fmt.Errorf("invalid date: %w", err)
			}
			cmd.Date = d
		case "titre":
			cmd.Title = value
		case "description":
			cmd.Description = value
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
		}
	}

	tc.currentVisit, tc.lastErr = tc.handler.Add(context.Background(), cmd)
	return nil
}

func (tc *testContext) visitIsAdded() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentVisit == nil {
		return fmt.Errorf("expected visit to be created")
	}
	return nil
}

func (tc *testContext) visitDateIs(dateStr string) error {
	expected, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	if !tc.currentVisit.Date.Equal(expected) {
		return fmt.Errorf("expected date %v, got %v", expected, tc.currentVisit.Date)
	}
	return nil
}

func (tc *testContext) visitCoordsAre(latStr, lngStr string) error {
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return fmt.Errorf("invalid latitude: %w", err)
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		return fmt.Errorf("invalid longitude: %w", err)
	}
	if tc.currentVisit.Lat != lat {
		return fmt.Errorf("expected lat %v, got %v", lat, tc.currentVisit.Lat)
	}
	if tc.currentVisit.Lng != lng {
		return fmt.Errorf("expected lng %v, got %v", lng, tc.currentVisit.Lng)
	}
	return nil
}

func (tc *testContext) addVisitWithoutDate() error {
	tc.currentVisit, tc.lastErr = tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Title:   "Visite sans date",
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	return nil
}

func (tc *testContext) addVisitWithoutGPS() error {
	tc.currentVisit, tc.lastErr = tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Date:    time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC),
		Title:   "Visite sans GPS",
	})
	return nil
}

func (tc *testContext) errDateRequired() error {
	if !errors.Is(tc.lastErr, visit.ErrDateRequired) {
		return fmt.Errorf("expected ErrDateRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) errVisitGPSRequired() error {
	if !errors.Is(tc.lastErr, visit.ErrGPSRequired) {
		return fmt.Errorf("expected ErrGPSRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) visitIsNotCreated() error {
	if tc.currentVisit != nil {
		return fmt.Errorf("expected visit to be nil, got %+v", tc.currentVisit)
	}
	return nil
}

func (tc *testContext) stageExistsInAnotherTrip(city string) error {
	stageID := "stage-" + city
	tc.foreignStage = stageID
	tc.stageChecker.stagesInTrip[stageID] = "trip-other"
	return nil
}

func (tc *testContext) addVisitWithForeignStage() error {
	tc.currentVisit, tc.lastErr = tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.foreignStage,
		Date:    time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC),
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	return nil
}

func (tc *testContext) errStageNotInTrip() error {
	if !errors.Is(tc.lastErr, visit.ErrStageNotInTrip) {
		return fmt.Errorf("expected ErrStageNotInTrip, got: %v", tc.lastErr)
	}
	return nil
}
