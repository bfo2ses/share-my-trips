package visit_test

import (
	"context"
	"sort"
	"testing"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// stubTripChecker is a test double for visit.TripChecker.
type stubTripChecker struct {
	closedTripIDs map[string]bool
}

func newStubTripChecker() *stubTripChecker {
	return &stubTripChecker{closedTripIDs: make(map[string]bool)}
}

func (s *stubTripChecker) IsModifiable(_ context.Context, tripID string) (bool, error) {
	return !s.closedTripIDs[tripID], nil
}

// visitRepository is an in-memory visit.Repository for tests.
type visitRepository struct {
	visits map[string]*visit.Visit
}

func newVisitRepository() *visitRepository {
	return &visitRepository{visits: make(map[string]*visit.Visit)}
}

func (r *visitRepository) Save(_ context.Context, v *visit.Visit) error {
	cp := *v
	cp.StageIDs = make([]string, len(v.StageIDs))
	copy(cp.StageIDs, v.StageIDs)
	r.visits[v.ID] = &cp
	return nil
}

func (r *visitRepository) FindByID(_ context.Context, id string) (*visit.Visit, error) {
	v, ok := r.visits[id]
	if !ok {
		return nil, visit.ErrNotFound
	}
	cp := *v
	cp.StageIDs = make([]string, len(v.StageIDs))
	copy(cp.StageIDs, v.StageIDs)
	return &cp, nil
}

func (r *visitRepository) ListByStage(_ context.Context, stageID string) ([]*visit.Visit, error) {
	var result []*visit.Visit
	for _, v := range r.visits {
		if v.HasStage(stageID) {
			cp := *v
			cp.StageIDs = make([]string, len(v.StageIDs))
			copy(cp.StageIDs, v.StageIDs)
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *visitRepository) ListByTrip(_ context.Context, tripID string) ([]*visit.Visit, error) {
	var result []*visit.Visit
	for _, v := range r.visits {
		if v.TripID == tripID {
			cp := *v
			cp.StageIDs = make([]string, len(v.StageIDs))
			copy(cp.StageIDs, v.StageIDs)
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *visitRepository) Delete(_ context.Context, id string) error {
	if _, ok := r.visits[id]; !ok {
		return visit.ErrNotFound
	}
	delete(r.visits, id)
	return nil
}

func (r *visitRepository) ListByStageAndDate(_ context.Context, stageID string, date time.Time) ([]*visit.Visit, error) {
	var result []*visit.Visit
	for _, v := range r.visits {
		if len(v.StageIDs) > 0 && v.StageIDs[0] == stageID && v.Date.Equal(date) {
			cp := *v
			cp.StageIDs = make([]string, len(v.StageIDs))
			copy(cp.StageIDs, v.StageIDs)
			result = append(result, &cp)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Position < result[j].Position
	})
	return result, nil
}

func (r *visitRepository) NextPosition(_ context.Context, stageID string, date time.Time) (int, error) {
	max := -1
	for _, v := range r.visits {
		if len(v.StageIDs) > 0 && v.StageIDs[0] == stageID && v.Date.Equal(date) && v.Position > max {
			max = v.Position
		}
	}
	return max + 1, nil
}

func (r *visitRepository) Reorder(_ context.Context, stageID string, date time.Time, orderedIDs []string) error {
	for pos, id := range orderedIDs {
		if v, ok := r.visits[id]; ok && len(v.StageIDs) > 0 && v.StageIDs[0] == stageID && v.Date.Equal(date) {
			v.Position = pos
		}
	}
	return nil
}

func (r *visitRepository) DetachStage(_ context.Context, stageID string) error {
	for id, v := range r.visits {
		if !v.HasStage(stageID) {
			continue
		}
		if len(v.StageIDs) == 1 {
			delete(r.visits, id)
		} else {
			newIDs := make([]string, 0, len(v.StageIDs)-1)
			for _, sid := range v.StageIDs {
				if sid != stageID {
					newIDs = append(newIDs, sid)
				}
			}
			v.StageIDs = newIDs
		}
	}
	return nil
}

// stubStageChecker is a test double for visit.StageChecker.
type stubStageChecker struct {
	stagesInTrip map[string]string // stageID -> tripID
}

func newStubStageChecker() *stubStageChecker {
	return &stubStageChecker{stagesInTrip: make(map[string]string)}
}

func (s *stubStageChecker) BelongsToTrip(_ context.Context, stageID, tripID string) (bool, error) {
	tid, ok := s.stagesInTrip[stageID]
	return ok && tid == tripID, nil
}

type testContext struct {
	handler           *visit.Handler
	repo              *visitRepository
	tripChecker       *stubTripChecker
	stageChecker      *stubStageChecker
	defaultTripID     string
	defaultStage      string
	secondStage       string
	foreignStage      string
	currentVisit      *visit.Visit
	lastErr           error
	dayDate           time.Time
	dayVisitIDByTitle map[string]string
	previousPosition  int
	snapshotPositions map[string]int
}

func newTestContext() *testContext {
	repo := newVisitRepository()
	tripChecker := newStubTripChecker()
	stageChecker := newStubStageChecker()
	return &testContext{
		handler:       visit.NewHandler(repo, tripChecker, stageChecker),
		repo:          repo,
		tripChecker:   tripChecker,
		stageChecker:  stageChecker,
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
	registerReorderSteps(ctx, tc)
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
