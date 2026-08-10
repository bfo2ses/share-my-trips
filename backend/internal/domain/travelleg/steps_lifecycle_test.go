package travelleg

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"
)

func registerLifecycleFeatureSteps(ctx *godog.ScenarioContext, tc *featureContext) {
	ctx.Step(`^que les étapes "([^"]*)" et "([^"]*)" sont consécutives sans trajet$`, tc.stagesAreConsecutiveWithoutLeg)
	ctx.Step(`^je déplace le trajet entre "([^"]*)" et "([^"]*)"$`, tc.moveLeg)
	ctx.Step(`^le trajet relie "([^"]*)" à "([^"]*)"$`, tc.legConnects)
	ctx.Step(`^qu'un voyage "([^"]*)" est clôturé$`, tc.tripIsClosed)
	ctx.Step(`^je tente de créer un trajet dans le voyage "([^"]*)"$`, tc.tryToCreateLegInNamedTrip)
	ctx.Step(`^un message d'erreur m'indique que le voyage est clôturé$`, tc.errTripClosed)
}

func (tc *featureContext) stagesAreConsecutiveWithoutLeg(from, to string) error {
	stages := tc.sequence.byTrip[tc.activeTripID]
	if len(stages) == 0 {
		tc.setSequence(from, to)
		return nil
	}
	fromID, toID := tc.stageID(from), tc.stageID(to)
	for index, stage := range stages {
		if stage.ID != fromID {
			continue
		}
		if index+1 < len(stages) && stages[index+1].ID == toID {
			return nil
		}
		if index == len(stages)-1 {
			tc.sequence.byTrip[tc.activeTripID] = append(stages, StageRef{ID: toID, TripID: tc.activeTripID})
			return nil
		}
	}
	return fmt.Errorf("cannot make %q and %q consecutive without changing existing sequence", from, to)
}

func (tc *featureContext) moveLeg(from, to string) error {
	if tc.currentLeg == nil {
		return fmt.Errorf("no travel leg exists")
	}
	tc.currentLeg, tc.lastErr = tc.handler.Move(context.Background(), MoveTravelLegCommand{
		ID: tc.currentLeg.ID, FromStageID: tc.stageID(from), ToStageID: tc.stageID(to),
	})
	return nil
}

func (tc *featureContext) legConnects(from, to string) error {
	if tc.currentLeg == nil || tc.currentLeg.FromStageID != tc.stageID(from) || tc.currentLeg.ToStageID != tc.stageID(to) {
		return fmt.Errorf("expected leg between %q and %q", from, to)
	}
	return nil
}

func (tc *featureContext) tripIsClosed(name string) error {
	tc.trips[tc.tripID(name)] = false
	return nil
}

func (tc *featureContext) tryToCreateLegInNamedTrip(name string) error {
	tripID := tc.tripID(name)
	tc.currentLeg, tc.lastErr = tc.handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: tripID, FromStageID: "stage-a", ToStageID: "stage-b", Transport: TransportCar,
	})
	return nil
}

func (tc *featureContext) errTripClosed() error {
	if !errors.Is(tc.lastErr, ErrTripClosed) {
		return fmt.Errorf("expected closed-trip error, got %v", tc.lastErr)
	}
	return nil
}
