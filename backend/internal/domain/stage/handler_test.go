package stage_test

import (
	"context"
	"testing"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
)

// stubTripChecker is a test double for stage.TripChecker.
type stubTripChecker struct {
	closedTripIDs map[string]bool
}

func newStubTripChecker() *stubTripChecker {
	return &stubTripChecker{closedTripIDs: make(map[string]bool)}
}

func (s *stubTripChecker) IsModifiable(_ context.Context, tripID string) (bool, error) {
	return !s.closedTripIDs[tripID], nil
}

// stubDayDetacher is a test double for stage.DayDetacher.
type stubDayDetacher struct {
	detachedStageIDs []string
}

func (s *stubDayDetacher) DetachStage(_ context.Context, stageID string) error {
	s.detachedStageIDs = append(s.detachedStageIDs, stageID)
	return nil
}

type stageRepository struct {
	stages map[string]*stage.Stage
}

func newStageRepository() *stageRepository {
	return &stageRepository{stages: make(map[string]*stage.Stage)}
}

func (r *stageRepository) Save(_ context.Context, s *stage.Stage) error {
	cp := *s
	r.stages[s.ID] = &cp
	return nil
}

func (r *stageRepository) FindByID(_ context.Context, id string) (*stage.Stage, error) {
	s, ok := r.stages[id]
	if !ok {
		return nil, stage.ErrNotFound
	}
	cp := *s
	return &cp, nil
}

func (r *stageRepository) ListByTrip(_ context.Context, tripID string) ([]*stage.Stage, error) {
	var result []*stage.Stage
	for _, s := range r.stages {
		if s.TripID == tripID {
			cp := *s
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *stageRepository) Delete(_ context.Context, id string) error {
	if _, ok := r.stages[id]; !ok {
		return stage.ErrNotFound
	}
	delete(r.stages, id)
	return nil
}

type testContext struct {
	handler      *stage.Handler
	tripChecker  *stubTripChecker
	dayDetacher  *stubDayDetacher
	repo         *stageRepository
	currentStage *stage.Stage
	lastErr      error
	// tripID for the default trip
	defaultTripID string
	// tripID for the closed trip
	closedTripID string
}

func newTestContext() *testContext {
	repo := newStageRepository()
	tripChecker := newStubTripChecker()
	dayDetacher := &stubDayDetacher{}
	return &testContext{
		handler:       stage.NewHandler(repo, tripChecker, dayDetacher),
		repo:          repo,
		tripChecker:   tripChecker,
		dayDetacher:   dayDetacher,
		defaultTripID: "trip-iceland",
		closedTripID:  "trip-japan",
	}
}

func InitializeScenario(ctx *godog.ScenarioContext) {
	tc := newTestContext()

	ctx.Before(func(ctx context.Context, sc *godog.Scenario) (context.Context, error) {
		*tc = *newTestContext()
		return ctx, nil
	})

	registerCreationSteps(ctx, tc)
	registerUpdateSteps(ctx, tc)
	registerDeleteSteps(ctx, tc)
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
