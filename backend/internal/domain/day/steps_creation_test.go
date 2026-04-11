package day_test

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
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
	ctx.Step(`^j'ajoute un jour avec les informations suivantes :$`, tc.addDayWithDetails)
	ctx.Step(`^le jour est ajouté à l'étape$`, tc.dayIsAdded)
	ctx.Step(`^la date du jour est "([^"]*)"$`, tc.dayDateIs)
	ctx.Step(`^les coordonnées du jour sont ([\-0-9.]+), ([\-0-9.]+)$`, tc.dayCoordsAre)
	ctx.Step(`^je tente d'ajouter un jour sans date$`, tc.addDayWithoutDate)
	ctx.Step(`^je tente d'ajouter un jour sans coordonnées GPS$`, tc.addDayWithoutGPS)
	ctx.Step(`^un message d'erreur m'indique que la date est obligatoire$`, tc.errDateRequired)
	ctx.Step(`^un message d'erreur m'indique que les coordonnées du jour sont obligatoires$`, tc.errDayGPSRequired)
	ctx.Step(`^le jour n'est pas créé$`, tc.dayIsNotCreated)
	ctx.Step(`^une étape "([^"]*)" appartient à un autre voyage$`, tc.stageExistsInAnotherTrip)
	ctx.Step(`^je tente d'ajouter un jour avec l'étape de l'autre voyage$`, tc.addDayWithForeignStage)
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

func (tc *testContext) addDayWithDetails(table *godog.Table) error {
	cmd := day.AddDayCommand{
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

	tc.currentDay, tc.lastErr = tc.handler.Add(context.Background(), cmd)
	return nil
}

func (tc *testContext) dayIsAdded() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentDay == nil {
		return fmt.Errorf("expected day to be created")
	}
	return nil
}

func (tc *testContext) dayDateIs(dateStr string) error {
	expected, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return err
	}
	if !tc.currentDay.Date.Equal(expected) {
		return fmt.Errorf("expected date %v, got %v", expected, tc.currentDay.Date)
	}
	return nil
}

func (tc *testContext) dayCoordsAre(latStr, lngStr string) error {
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return fmt.Errorf("invalid latitude: %w", err)
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		return fmt.Errorf("invalid longitude: %w", err)
	}
	if tc.currentDay.Lat != lat {
		return fmt.Errorf("expected lat %v, got %v", lat, tc.currentDay.Lat)
	}
	if tc.currentDay.Lng != lng {
		return fmt.Errorf("expected lng %v, got %v", lng, tc.currentDay.Lng)
	}
	return nil
}

func (tc *testContext) addDayWithoutDate() error {
	tc.currentDay, tc.lastErr = tc.handler.Add(context.Background(), day.AddDayCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Title:   "Jour sans date",
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	return nil
}

func (tc *testContext) addDayWithoutGPS() error {
	tc.currentDay, tc.lastErr = tc.handler.Add(context.Background(), day.AddDayCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.defaultStage,
		Date:    time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC),
		Title:   "Jour sans GPS",
	})
	return nil
}

func (tc *testContext) errDateRequired() error {
	if !errors.Is(tc.lastErr, day.ErrDateRequired) {
		return fmt.Errorf("expected ErrDateRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) errDayGPSRequired() error {
	if !errors.Is(tc.lastErr, day.ErrGPSRequired) {
		return fmt.Errorf("expected ErrGPSRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) dayIsNotCreated() error {
	if tc.currentDay != nil {
		return fmt.Errorf("expected day to be nil, got %+v", tc.currentDay)
	}
	return nil
}

func (tc *testContext) stageExistsInAnotherTrip(city string) error {
	stageID := "stage-" + city
	tc.foreignStage = stageID
	tc.stageChecker.stagesInTrip[stageID] = "trip-other"
	return nil
}

func (tc *testContext) addDayWithForeignStage() error {
	tc.currentDay, tc.lastErr = tc.handler.Add(context.Background(), day.AddDayCommand{
		TripID:  tc.defaultTripID,
		StageID: tc.foreignStage,
		Date:    time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC),
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	return nil
}

func (tc *testContext) errStageNotInTrip() error {
	if !errors.Is(tc.lastErr, day.ErrStageNotInTrip) {
		return fmt.Errorf("expected ErrStageNotInTrip, got: %v", tc.lastErr)
	}
	return nil
}
