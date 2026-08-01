package visit_test

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

func registerReorderSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^l'étape contient les visites suivantes le "([^"]*)" :$`, tc.stageContainsVisitsOnDate)
	ctx.Step(`^je réordonne les visites du jour dans l'ordre suivant :$`, tc.reorderGroupVisits)
	ctx.Step(`^les visites du jour sont affichées dans l'ordre suivant :$`, tc.groupVisitsAreInOrder)
	ctx.Step(`^je tente de réordonner les visites du jour avec une liste incomplète$`, tc.reorderGroupVisitsWithIncompleteList)
	ctx.Step(`^un message d'erreur m'indique que les visites ne correspondent pas au jour des visites$`, tc.errReorderIDMismatch)
	ctx.Step(`^une visite "([^"]*)" existe dans l'étape "([^"]*)" le "([^"]*)"$`, tc.namedVisitExistsInStageOnDate)
	ctx.Step(`^je modifie la date de la visite au "([^"]*)"$`, tc.updateVisitDate)
	ctx.Step(`^la visite est en dernière position du jour dans l'étape "([^"]*)"$`, tc.visitIsLastInGroupForStage)
	ctx.Step(`^je tente de réordonner les visites du jour avec un identifiant dupliqué$`, tc.reorderGroupVisitsWithDuplicateID)
	ctx.Step(`^je tente de réordonner les visites du jour avec un identifiant d'un autre jour$`, tc.reorderGroupVisitsWithForeignID)
	ctx.Step(`^les visites du jour appartiennent au voyage clôturé$`, tc.reassignGroupVisitsToClosedTrip)
	ctx.Step(`^je mémorise la position de la visite$`, tc.rememberVisitPosition)
	ctx.Step(`^la position de la visite est inchangée$`, tc.positionIsUnchanged)
	ctx.Step(`^je mémorise les positions des visites du "([^"]*)"$`, tc.rememberGroupPositions)
	ctx.Step(`^les positions des visites du "([^"]*)" sont inchangées$`, tc.groupPositionsAreUnchanged)
	ctx.Step(`^je réordonne un jour sans aucune visite$`, tc.reorderEmptyGroup)
	ctx.Step(`^aucune erreur ne se produit$`, tc.noErrorOccurred)
}

func (tc *testContext) stageContainsVisitsOnDate(dateStr string, table *godog.Table) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date %q: %w", dateStr, err)
	}
	tc.groupDate = d
	tc.groupVisitIDByTitle = make(map[string]string)

	for _, row := range table.Rows[1:] {
		title := row.Cells[0].Value
		v, err := tc.handler.Add(context.Background(), visit.AddVisitCommand{
			TripID:  tc.defaultTripID,
			StageID: tc.defaultStage,
			Date:    d,
			Title:   title,
			Lat:     defaultLat,
			Lng:     defaultLng,
		})
		if err != nil {
			return fmt.Errorf("setup visit %q: %w", title, err)
		}
		tc.groupVisitIDByTitle[title] = v.ID
	}
	return nil
}

func (tc *testContext) reorderGroupVisits(table *godog.Table) error {
	ids := make([]string, 0, len(table.Rows)-1)
	for _, row := range table.Rows[1:] {
		title := row.Cells[0].Value
		id, ok := tc.groupVisitIDByTitle[title]
		if !ok {
			return fmt.Errorf("unknown visit title %q", title)
		}
		ids = append(ids, id)
	}
	result, err := tc.handler.Reorder(context.Background(), visit.ReorderVisitsCommand{
		StageID:  tc.defaultStage,
		Date:     tc.groupDate,
		VisitIDs: ids,
	})
	tc.lastErr = err
	if err != nil {
		return nil
	}
	// The handler's own return value must already reflect the new order —
	// callers (the GraphQL resolver) use it directly, without a follow-up query.
	if len(result) != len(ids) {
		return fmt.Errorf("expected Reorder to return %d visits, got %d", len(ids), len(result))
	}
	for i, id := range ids {
		if result[i].ID != id {
			return fmt.Errorf("Reorder result %d: expected visit %q, got %q", i, id, result[i].ID)
		}
	}
	return nil
}

func (tc *testContext) reorderEmptyGroup() error {
	result, err := tc.handler.Reorder(context.Background(), visit.ReorderVisitsCommand{
		StageID:  tc.defaultStage,
		Date:     time.Date(2099, 1, 1, 0, 0, 0, 0, time.UTC),
		VisitIDs: nil,
	})
	if result != nil {
		return fmt.Errorf("expected nil result for an empty group, got %d visits", len(result))
	}
	tc.lastErr = err
	return nil
}

func (tc *testContext) reorderGroupVisitsWithIncompleteList() error {
	var ids []string
	for _, id := range tc.groupVisitIDByTitle {
		ids = append(ids, id)
		break // a single ID out of several is an incomplete list.
	}
	_, err := tc.handler.Reorder(context.Background(), visit.ReorderVisitsCommand{
		StageID:  tc.defaultStage,
		Date:     tc.groupDate,
		VisitIDs: ids,
	})
	tc.lastErr = err
	return nil
}

func (tc *testContext) errReorderIDMismatch() error {
	if !errors.Is(tc.lastErr, visit.ErrReorderIDMismatch) {
		return fmt.Errorf("expected ErrReorderIDMismatch, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) noErrorOccurred() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	return nil
}

func (tc *testContext) groupVisitsAreInOrder(table *godog.Table) error {
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: tc.defaultStage})
	if err != nil {
		return err
	}

	var groupVisits []*visit.Visit
	for _, v := range visits {
		if v.Date.Equal(tc.groupDate) {
			groupVisits = append(groupVisits, v)
		}
	}

	expected := make([]string, 0, len(table.Rows)-1)
	for _, row := range table.Rows[1:] {
		expected = append(expected, row.Cells[0].Value)
	}

	if len(groupVisits) != len(expected) {
		return fmt.Errorf("expected %d visits, got %d", len(expected), len(groupVisits))
	}
	for i, v := range groupVisits {
		if v.Title != expected[i] {
			return fmt.Errorf("visit %d: expected %q, got %q", i, expected[i], v.Title)
		}
	}
	return nil
}

func (tc *testContext) namedVisitExistsInStageOnDate(title, stageName, dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date %q: %w", dateStr, err)
	}
	stageID := "stage-" + stageName
	_, err = tc.handler.Add(context.Background(), visit.AddVisitCommand{
		TripID:  tc.defaultTripID,
		StageID: stageID,
		Date:    d,
		Title:   title,
		Lat:     defaultLat,
		Lng:     defaultLng,
	})
	if err != nil {
		return fmt.Errorf("setup visit %q: %w", title, err)
	}
	return nil
}

func (tc *testContext) updateVisitDate(dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date %q: %w", dateStr, err)
	}
	updated, err := tc.handler.Update(context.Background(), visit.UpdateVisitCommand{
		ID:          tc.currentVisit.ID,
		Date:        d,
		Title:       tc.currentVisit.Title,
		Description: tc.currentVisit.Description,
		Lat:         tc.currentVisit.Lat,
		Lng:         tc.currentVisit.Lng,
	})
	if err == nil {
		tc.currentVisit = updated
	}
	tc.lastErr = err
	return nil
}

// reorderGroupVisitsWithDuplicateID builds a same-length ID list where one ID is
// duplicated in place of another, so a naive length+membership check would
// wrongly accept it even though one visit is missing from the list.
func (tc *testContext) reorderGroupVisitsWithDuplicateID() error {
	ids := make([]string, 0, len(tc.groupVisitIDByTitle))
	for _, id := range tc.groupVisitIDByTitle {
		ids = append(ids, id)
	}
	if len(ids) < 2 {
		return fmt.Errorf("need at least 2 visits for this scenario, got %d", len(ids))
	}
	dup := make([]string, len(ids))
	copy(dup, ids)
	dup[len(dup)-1] = dup[0]

	_, err := tc.handler.Reorder(context.Background(), visit.ReorderVisitsCommand{
		StageID:  tc.defaultStage,
		Date:     tc.groupDate,
		VisitIDs: dup,
	})
	tc.lastErr = err
	return nil
}

// reorderGroupVisitsWithForeignID builds a same-length ID list where the last ID
// is replaced by a visit that belongs to a different day, so membership must
// be checked per ID, not just by list length.
func (tc *testContext) reorderGroupVisitsWithForeignID() error {
	ids := make([]string, 0, len(tc.groupVisitIDByTitle))
	for _, id := range tc.groupVisitIDByTitle {
		ids = append(ids, id)
	}
	if len(ids) == 0 {
		return fmt.Errorf("need at least 1 visit for this scenario")
	}
	ids[len(ids)-1] = tc.currentVisit.ID

	_, err := tc.handler.Reorder(context.Background(), visit.ReorderVisitsCommand{
		StageID:  tc.defaultStage,
		Date:     tc.groupDate,
		VisitIDs: ids,
	})
	tc.lastErr = err
	return nil
}

func (tc *testContext) reassignGroupVisitsToClosedTrip() error {
	for _, id := range tc.groupVisitIDByTitle {
		v, err := tc.repo.FindByID(context.Background(), id)
		if err != nil {
			return err
		}
		v.TripID = "trip-japan"
		if err := tc.repo.Save(context.Background(), v); err != nil {
			return err
		}
	}
	return nil
}

func (tc *testContext) rememberVisitPosition() error {
	tc.previousPosition = tc.currentVisit.Position
	return nil
}

func (tc *testContext) positionIsUnchanged() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.currentVisit.Position != tc.previousPosition {
		return fmt.Errorf("expected position %d, got %d", tc.previousPosition, tc.currentVisit.Position)
	}
	return nil
}

func (tc *testContext) rememberGroupPositions(dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date %q: %w", dateStr, err)
	}
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: tc.defaultStage})
	if err != nil {
		return err
	}
	tc.snapshotPositions = make(map[string]int)
	for _, v := range visits {
		if v.Date.Equal(d) {
			tc.snapshotPositions[v.Title] = v.Position
		}
	}
	if len(tc.snapshotPositions) == 0 {
		return fmt.Errorf("no visits found on %s to snapshot", dateStr)
	}
	return nil
}

func (tc *testContext) groupPositionsAreUnchanged(dateStr string) error {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date %q: %w", dateStr, err)
	}
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: tc.defaultStage})
	if err != nil {
		return err
	}
	found := 0
	for _, v := range visits {
		if !v.Date.Equal(d) {
			continue
		}
		found++
		want, ok := tc.snapshotPositions[v.Title]
		if !ok {
			return fmt.Errorf("visit %q on %s was not in the snapshot", v.Title, dateStr)
		}
		if v.Position != want {
			return fmt.Errorf("visit %q: expected position %d, got %d", v.Title, want, v.Position)
		}
	}
	if found != len(tc.snapshotPositions) {
		return fmt.Errorf("expected %d visits on %s, found %d", len(tc.snapshotPositions), dateStr, found)
	}
	return nil
}

func (tc *testContext) visitIsLastInGroupForStage(stageName string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	stageID := "stage-" + stageName
	visits, err := tc.handler.ListByStage(context.Background(), visit.ListByStageQuery{StageID: stageID})
	if err != nil {
		return err
	}

	var groupVisits []*visit.Visit
	for _, v := range visits {
		if v.Date.Equal(tc.currentVisit.Date) {
			groupVisits = append(groupVisits, v)
		}
	}
	if len(groupVisits) == 0 {
		return fmt.Errorf("no visits found for stage %q on %v", stageName, tc.currentVisit.Date)
	}
	last := groupVisits[len(groupVisits)-1]
	if last.ID != tc.currentVisit.ID {
		return fmt.Errorf("expected visit %q to be last, got %q", tc.currentVisit.ID, last.ID)
	}
	return nil
}
