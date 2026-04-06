package trip_test

import (
	"context"
	"testing"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

type testContext struct {
	handler     *trip.Handler
	currentTrip *trip.Trip
	lastErr     error
}

func newTestContext() *testContext {
	repo := memory.NewTripRepository()
	return &testContext{
		handler: trip.NewHandler(repo),
	}
}

func parseStatus(s string) trip.Status {
	switch s {
	case "brouillon":
		return trip.StatusDraft
	case "publié":
		return trip.StatusPublished
	case "clôturé":
		return trip.StatusClosed
	default:
		return trip.Status(s)
	}
}

func InitializeScenario(ctx *godog.ScenarioContext) {
	tc := newTestContext()

	ctx.Before(func(ctx context.Context, sc *godog.Scenario) (context.Context, error) {
		*tc = *newTestContext()
		return ctx, nil
	})

	registerCreationSteps(ctx, tc)
	registerLifecycleSteps(ctx, tc)
	registerUpdateSteps(ctx, tc)
	registerDeleteSteps(ctx, tc)
	registerListSteps(ctx, tc)
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
