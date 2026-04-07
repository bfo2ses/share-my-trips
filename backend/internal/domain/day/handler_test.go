package day_test

import (
	"context"
	"testing"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

// stubTripChecker is a test double for day.TripChecker.
type stubTripChecker struct {
	closedTripIDs map[string]bool
}

func newStubTripChecker() *stubTripChecker {
	return &stubTripChecker{closedTripIDs: make(map[string]bool)}
}

func (s *stubTripChecker) IsModifiable(_ context.Context, tripID string) (bool, error) {
	return !s.closedTripIDs[tripID], nil
}

// dayRepository is an in-memory day.Repository for tests.
type dayRepository struct {
	days map[string]*day.Day
}

func newDayRepository() *dayRepository {
	return &dayRepository{days: make(map[string]*day.Day)}
}

func (r *dayRepository) Save(_ context.Context, d *day.Day) error {
	cp := *d
	cp.StageIDs = make([]string, len(d.StageIDs))
	copy(cp.StageIDs, d.StageIDs)
	r.days[d.ID] = &cp
	return nil
}

func (r *dayRepository) FindByID(_ context.Context, id string) (*day.Day, error) {
	d, ok := r.days[id]
	if !ok {
		return nil, day.ErrNotFound
	}
	cp := *d
	cp.StageIDs = make([]string, len(d.StageIDs))
	copy(cp.StageIDs, d.StageIDs)
	return &cp, nil
}

func (r *dayRepository) ListByStage(_ context.Context, stageID string) ([]*day.Day, error) {
	var result []*day.Day
	for _, d := range r.days {
		if d.HasStage(stageID) {
			cp := *d
			cp.StageIDs = make([]string, len(d.StageIDs))
			copy(cp.StageIDs, d.StageIDs)
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *dayRepository) ListByTrip(_ context.Context, tripID string) ([]*day.Day, error) {
	var result []*day.Day
	for _, d := range r.days {
		if d.TripID == tripID {
			cp := *d
			cp.StageIDs = make([]string, len(d.StageIDs))
			copy(cp.StageIDs, d.StageIDs)
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *dayRepository) Delete(_ context.Context, id string) error {
	if _, ok := r.days[id]; !ok {
		return day.ErrNotFound
	}
	delete(r.days, id)
	return nil
}

func (r *dayRepository) DetachStage(_ context.Context, stageID string) error {
	for id, d := range r.days {
		if !d.HasStage(stageID) {
			continue
		}
		if len(d.StageIDs) == 1 {
			delete(r.days, id)
		} else {
			newIDs := make([]string, 0, len(d.StageIDs)-1)
			for _, sid := range d.StageIDs {
				if sid != stageID {
					newIDs = append(newIDs, sid)
				}
			}
			d.StageIDs = newIDs
		}
	}
	return nil
}

type testContext struct {
	handler       *day.Handler
	repo          *dayRepository
	tripChecker   *stubTripChecker
	defaultTripID string
	defaultStage  string
	secondStage   string
	currentDay    *day.Day
	lastErr       error
}

func newTestContext() *testContext {
	repo := newDayRepository()
	tripChecker := newStubTripChecker()
	return &testContext{
		handler:       day.NewHandler(repo, tripChecker),
		repo:          repo,
		tripChecker:   tripChecker,
		defaultTripID: "trip-iceland",
		// defaultStage is set dynamically by the Contexte step
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
	registerMultiStageSteps(ctx, tc)
	registerListSteps(ctx, tc)
	registerLifecycleSteps(ctx, tc)
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
