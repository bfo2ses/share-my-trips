package stage_test

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
)

func registerCreationSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^un voyage "([^"]*)" existe et n'est pas clôturé$`, tc.tripExistsAndOpen)
	ctx.Step(`^je tente d'ajouter une étape au voyage clôturé$`, tc.addStageToClosedTrip)
	ctx.Step(`^j'ajoute une étape avec les informations suivantes :$`, tc.addStageWithDetails)
	ctx.Step(`^l'étape est ajoutée au voyage$`, tc.stageIsAdded)
	ctx.Step(`^l'étape est affichée sous le nom "([^"]*)"$`, tc.stageDisplayName)
	ctx.Step(`^je tente d'ajouter une étape sans renseigner la ville$`, tc.addStageWithoutCity)
	ctx.Step(`^un message d'erreur m'indique que la ville est obligatoire$`, tc.errCityRequired)
	ctx.Step(`^l'étape n'est pas créée$`, tc.stageIsNotCreated)
	ctx.Step(`^je tente d'ajouter une étape sans coordonnées GPS$`, tc.addStageWithoutGPS)
	ctx.Step(`^un message d'erreur m'indique que les coordonnées sont obligatoires$`, tc.errGPSRequired)
}

func (tc *testContext) tripExistsAndOpen(_ string) error {
	// The default trip is already open (no closed entry in tripChecker).
	return nil
}

func (tc *testContext) addStageToClosedTrip() error {
	tc.currentStage, tc.lastErr = tc.handler.Add(context.Background(), stage.AddStageCommand{
		TripID: tc.closedTripID,
		City:   "Tokyo",
		Lat:    35.6762,
		Lng:    139.6503,
	})
	return nil
}

func (tc *testContext) addStageWithDetails(table *godog.Table) error {
	cmd := stage.AddStageCommand{TripID: tc.defaultTripID}

	for _, row := range table.Rows[1:] {
		field := row.Cells[0].Value
		value := row.Cells[1].Value

		switch field {
		case "ville":
			cmd.City = value
		case "nom":
			cmd.Name = value
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
		case "description":
			cmd.Description = value
		}
	}

	tc.currentStage, tc.lastErr = tc.handler.Add(context.Background(), cmd)
	return nil
}

func (tc *testContext) stageIsAdded() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentStage == nil {
		return fmt.Errorf("expected stage to be created")
	}
	return nil
}

func (tc *testContext) stageDisplayName(expected string) error {
	if tc.currentStage.DisplayName() != expected {
		return fmt.Errorf("expected display name %q, got %q", expected, tc.currentStage.DisplayName())
	}
	return nil
}

func (tc *testContext) addStageWithoutCity() error {
	tc.currentStage, tc.lastErr = tc.handler.Add(context.Background(), stage.AddStageCommand{
		TripID: tc.defaultTripID,
		Lat:    64.1466,
		Lng:    -21.9426,
	})
	return nil
}

func (tc *testContext) errCityRequired() error {
	if !errors.Is(tc.lastErr, stage.ErrCityRequired) {
		return fmt.Errorf("expected ErrCityRequired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) stageIsNotCreated() error {
	if tc.currentStage != nil {
		return fmt.Errorf("expected stage to be nil, got %+v", tc.currentStage)
	}
	return nil
}

func (tc *testContext) addStageWithoutGPS() error {
	tc.currentStage, tc.lastErr = tc.handler.Add(context.Background(), stage.AddStageCommand{
		TripID: tc.defaultTripID,
		City:   "Reykjavik",
	})
	return nil
}

func (tc *testContext) errGPSRequired() error {
	if !errors.Is(tc.lastErr, stage.ErrGPSRequired) {
		return fmt.Errorf("expected ErrGPSRequired, got: %v", tc.lastErr)
	}
	return nil
}
