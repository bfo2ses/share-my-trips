package travelleg

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/cucumber/godog"
)

func registerCreationFeatureSteps(ctx *godog.ScenarioContext, tc *featureContext) {
	ctx.Step(`^je suis connecté en tant qu'administrateur$`, func() error { return nil })
	ctx.Step(`^qu'un voyage "([^"]*)" existe et n'est pas clôturé$`, tc.tripExistsAndIsOpen)
	ctx.Step(`^les étapes "([^"]*)" et "([^"]*)" sont consécutives dans le voyage$`, tc.stagesAreConsecutive)
	ctx.Step(`^les étapes "([^"]*)", "([^"]*)" et "([^"]*)" existent dans cet ordre$`, tc.threeStagesExistInOrder)
	ctx.Step(`^je crée un trajet en voiture entre "([^"]*)" et "([^"]*)"$`, tc.createCarLeg)
	ctx.Step(`^je tente de créer un trajet entre "([^"]*)" et "([^"]*)"$`, tc.tryToCreateLeg)
	ctx.Step(`^le trajet est ajouté au voyage$`, tc.legIsAdded)
	ctx.Step(`^le trajet utilise le moyen de locomotion "([^"]*)"$`, tc.legUsesTransport)
	ctx.Step(`^un message d'erreur m'indique que les étapes doivent être consécutives$`, tc.errStagesNotConsecutive)
	ctx.Step(`^le trajet n'est pas créé$`, tc.legIsNotCreated)
	ctx.Step(`^qu'un trajet en voiture existe entre "([^"]*)" et "([^"]*)"$`, tc.carLegExists)
	ctx.Step(`^je crée un autre trajet entre "([^"]*)" et "([^"]*)"$`, tc.tryToCreateLeg)
	ctx.Step(`^un message d'erreur m'indique qu'un trajet existe déjà$`, tc.errPairAlreadyExists)
	ctx.Step(`^je crée un trajet en avion sans distance$`, tc.createPlaneLegWithoutDistance)
	ctx.Step(`^je renseigne une distance négative$`, tc.setNegativeDistance)
	ctx.Step(`^un message d'erreur m'indique que la distance doit être positive$`, tc.errDistanceInvalid)
}

func (tc *featureContext) tripExistsAndIsOpen(name string) error {
	tc.activeTripID = tc.tripID(name)
	tc.trips[tc.activeTripID] = true
	return nil
}

func (tc *featureContext) stagesAreConsecutive(from, to string) error {
	tc.setSequence(from, to)
	return nil
}

func (tc *featureContext) threeStagesExistInOrder(first, second, third string) error {
	tc.setSequence(first, second, third)
	return nil
}

func (tc *featureContext) createCarLeg(from, to string) error {
	tc.createLeg(from, to, TransportCar, nil)
	return nil
}

func (tc *featureContext) tryToCreateLeg(from, to string) error {
	tc.createLeg(from, to, TransportCar, nil)
	return nil
}

func (tc *featureContext) carLegExists(from, to string) error {
	if len(tc.sequence.byTrip[tc.activeTripID]) == 0 {
		tc.setSequence(from, to)
	}
	tc.createLeg(from, to, TransportCar, nil)
	if tc.lastErr != nil {
		return tc.lastErr
	}
	return nil
}

func (tc *featureContext) createPlaneLegWithoutDistance() error {
	if len(tc.sequence.byTrip[tc.activeTripID]) < 2 {
		return fmt.Errorf("two consecutive stages are required")
	}
	stages := tc.sequence.byTrip[tc.activeTripID]
	tc.createLegByID(stages[0].ID, stages[1].ID, TransportPlane, nil)
	return nil
}

func (tc *featureContext) createLeg(from, to string, transport Transport, distance *float64) {
	tc.createLegByID(tc.stageID(from), tc.stageID(to), transport, distance)
}

func (tc *featureContext) createLegByID(from, to string, transport Transport, distance *float64) {
	tc.currentLeg, tc.lastErr = tc.handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: tc.activeTripID, FromStageID: from, ToStageID: to, Transport: transport, DistanceKm: distance,
	})
}

func (tc *featureContext) legIsAdded() error {
	if tc.lastErr != nil || tc.currentLeg == nil {
		return fmt.Errorf("expected a travel leg, got %v", tc.lastErr)
	}
	return nil
}

func (tc *featureContext) legUsesTransport(transport string) error {
	if tc.currentLeg == nil {
		return fmt.Errorf("no travel leg was created")
	}
	if tc.currentLeg.Transport != transportFromFrench(transport) {
		return fmt.Errorf("expected transport %q, got %q", transport, tc.currentLeg.Transport)
	}
	return nil
}

func (tc *featureContext) errStagesNotConsecutive() error {
	if !errors.Is(tc.lastErr, ErrStagesNotConsecutive) {
		return fmt.Errorf("expected consecutive-stage error, got %v", tc.lastErr)
	}
	return nil
}

func (tc *featureContext) legIsNotCreated() error {
	if tc.currentLeg != nil {
		return fmt.Errorf("expected no travel leg, got %q", tc.currentLeg.ID)
	}
	return nil
}

func (tc *featureContext) errPairAlreadyExists() error {
	if !errors.Is(tc.lastErr, ErrPairAlreadyExists) {
		return fmt.Errorf("expected duplicate pair error, got %v", tc.lastErr)
	}
	return nil
}

func (tc *featureContext) setNegativeDistance() error {
	if tc.currentLeg == nil {
		return fmt.Errorf("no travel leg exists")
	}
	negative := -1.0
	tc.lastErr = tc.currentLeg.Update(tc.currentLeg.Transport, tc.currentLeg.Description, &negative)
	return nil
}

func (tc *featureContext) errDistanceInvalid() error {
	if !errors.Is(tc.lastErr, ErrInvalidDistance) {
		return fmt.Errorf("expected invalid-distance error, got %v", tc.lastErr)
	}
	return nil
}

func (tc *featureContext) tripID(name string) string {
	if id, ok := tc.tripIDs[name]; ok {
		return id
	}
	id := "trip-" + strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	tc.tripIDs[name] = id
	return id
}

func (tc *featureContext) stageID(name string) string {
	if id, ok := tc.stageIDs[name]; ok {
		return id
	}
	id := "stage-" + strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	tc.stageIDs[name] = id
	return id
}

func (tc *featureContext) setSequence(names ...string) {
	stages := make([]StageRef, 0, len(names))
	for _, name := range names {
		stages = append(stages, StageRef{ID: tc.stageID(name), TripID: tc.activeTripID})
	}
	tc.sequence.byTrip[tc.activeTripID] = stages
}

func transportFromFrench(transport string) Transport {
	switch transport {
	case "voiture":
		return TransportCar
	case "train":
		return TransportTrain
	case "avion":
		return TransportPlane
	case "bateau":
		return TransportBoat
	default:
		return Transport(transport)
	}
}
