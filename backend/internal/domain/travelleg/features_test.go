package travelleg

import (
	"context"
	"testing"

	"github.com/cucumber/godog"
)

type featureContext struct {
	handler      *Handler
	repo         *repository
	sequence     *stubStageSequence
	trips        modifiableTrips
	tripIDs      map[string]string
	stageIDs     map[string]string
	currentLeg   *TravelLeg
	lastErr      error
	activeTripID string
}

func newFeatureContext() *featureContext {
	tripStates := modifiableTrips{}
	sequence := &stubStageSequence{byTrip: map[string][]StageRef{}}
	repo := newRepository()
	return &featureContext{
		repo:     repo,
		sequence: sequence,
		trips:    tripStates,
		tripIDs:  map[string]string{},
		stageIDs: map[string]string{},
		handler:  NewHandler(repo, tripStates, sequence),
	}
}

func InitializeScenario(ctx *godog.ScenarioContext) {
	tc := newFeatureContext()
	ctx.Before(func(ctx context.Context, _ *godog.Scenario) (context.Context, error) {
		*tc = *newFeatureContext()
		return ctx, nil
	})

	registerCreationFeatureSteps(ctx, tc)
	registerLifecycleFeatureSteps(ctx, tc)
}

func TestFeatures(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"testdata"},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
