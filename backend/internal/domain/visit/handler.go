package visit

import (
	"context"
	"fmt"
	"sort"

	"github.com/google/uuid"
)

// Handler handles commands and queries for the visit context.
type Handler struct {
	repo         Repository
	tripChecker  TripChecker
	stageChecker StageChecker
}

// NewHandler creates a new visit Handler.
func NewHandler(repo Repository, tripChecker TripChecker, stageChecker StageChecker) *Handler {
	return &Handler{
		repo:         repo,
		tripChecker:  tripChecker,
		stageChecker: stageChecker,
	}
}

// --- Commands ---

// Add handles the AddVisitCommand.
func (h *Handler) Add(ctx context.Context, cmd AddVisitCommand) (*Visit, error) {
	modifiable, err := h.tripChecker.IsModifiable(ctx, cmd.TripID)
	if err != nil {
		return nil, fmt.Errorf("add visit: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("add visit: %w", ErrTripClosed)
	}

	ok, err := h.stageChecker.BelongsToTrip(ctx, cmd.StageID, cmd.TripID)
	if err != nil {
		return nil, fmt.Errorf("add visit: %w", err)
	}
	if !ok {
		return nil, fmt.Errorf("add visit: %w", ErrStageNotInTrip)
	}

	pos, err := h.repo.NextPosition(ctx, cmd.StageID, cmd.Date)
	if err != nil {
		return nil, fmt.Errorf("add visit: %w", err)
	}

	id := uuid.New().String()
	v, err := NewVisit(id, cmd.TripID, cmd.StageID, cmd.Date, cmd.Title, cmd.Description, cmd.Lat, cmd.Lng, pos)
	if err != nil {
		return nil, fmt.Errorf("add visit: %w", err)
	}

	if err := h.repo.Save(ctx, v); err != nil {
		return nil, fmt.Errorf("add visit: %w", err)
	}

	return v, nil
}

// Update handles the UpdateVisitCommand.
func (h *Handler) Update(ctx context.Context, cmd UpdateVisitCommand) (*Visit, error) {
	v, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("update visit: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, v.TripID)
	if err != nil {
		return nil, fmt.Errorf("update visit: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("update visit: %w", ErrTripClosed)
	}

	oldDate := v.Date
	if err := v.Update(cmd.Date, cmd.Title, cmd.Description, cmd.Lat, cmd.Lng); err != nil {
		return nil, fmt.Errorf("update visit: %w", err)
	}

	// Moving to a different day leaves the visit's old (stage, date) group.
	// Recompute its position at the end of the new group rather than
	// carrying over a value that may now collide with another visit.
	if !v.Date.Equal(oldDate) {
		pos, err := h.repo.NextPosition(ctx, v.StageIDs[0], v.Date)
		if err != nil {
			return nil, fmt.Errorf("update visit: %w", err)
		}
		v.Position = pos
	}

	if err := h.repo.Save(ctx, v); err != nil {
		return nil, fmt.Errorf("update visit: %w", err)
	}

	return v, nil
}

// Delete handles the DeleteVisitCommand.
func (h *Handler) Delete(ctx context.Context, cmd DeleteVisitCommand) error {
	v, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return fmt.Errorf("delete visit: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, v.TripID)
	if err != nil {
		return fmt.Errorf("delete visit: %w", err)
	}
	if !modifiable {
		return fmt.Errorf("delete visit: %w", ErrTripClosed)
	}

	if err := h.repo.Delete(ctx, cmd.ID); err != nil {
		return fmt.Errorf("delete visit: %w", err)
	}

	return nil
}

// AttachToStage handles the AttachToStageCommand.
func (h *Handler) AttachToStage(ctx context.Context, cmd AttachToStageCommand) (*Visit, error) {
	v, err := h.repo.FindByID(ctx, cmd.VisitID)
	if err != nil {
		return nil, fmt.Errorf("attach visit to stage: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, v.TripID)
	if err != nil {
		return nil, fmt.Errorf("attach visit to stage: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("attach visit to stage: %w", ErrTripClosed)
	}

	belongs, err := h.stageChecker.BelongsToTrip(ctx, cmd.StageID, v.TripID)
	if err != nil {
		return nil, fmt.Errorf("attach visit to stage: %w", err)
	}
	if !belongs {
		return nil, fmt.Errorf("attach visit to stage: %w", ErrStageNotInTrip)
	}

	if err := v.AttachToStage(cmd.StageID); err != nil {
		return nil, fmt.Errorf("attach visit to stage: %w", err)
	}

	if err := h.repo.Save(ctx, v); err != nil {
		return nil, fmt.Errorf("attach visit to stage: %w", err)
	}

	return v, nil
}

// DetachFromStage handles the DetachFromStageCommand.
func (h *Handler) DetachFromStage(ctx context.Context, cmd DetachFromStageCommand) (*Visit, error) {
	v, err := h.repo.FindByID(ctx, cmd.VisitID)
	if err != nil {
		return nil, fmt.Errorf("detach visit from stage: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, v.TripID)
	if err != nil {
		return nil, fmt.Errorf("detach visit from stage: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("detach visit from stage: %w", ErrTripClosed)
	}

	oldPrimaryStage := v.StageIDs[0]
	if err := v.DetachFromStage(cmd.StageID); err != nil {
		return nil, fmt.Errorf("detach visit from stage: %w", err)
	}

	// Detaching the primary stage promotes the next stage to StageIDs[0],
	// moving the visit into a different (stage, date) group.
	if v.StageIDs[0] != oldPrimaryStage {
		pos, err := h.repo.NextPosition(ctx, v.StageIDs[0], v.Date)
		if err != nil {
			return nil, fmt.Errorf("detach visit from stage: %w", err)
		}
		v.Position = pos
	}

	if err := h.repo.Save(ctx, v); err != nil {
		return nil, fmt.Errorf("detach visit from stage: %w", err)
	}

	return v, nil
}

// --- Queries ---

// GetByID handles the GetVisitQuery.
func (h *Handler) GetByID(ctx context.Context, query GetVisitQuery) (*Visit, error) {
	v, err := h.repo.FindByID(ctx, query.ID)
	if err != nil {
		return nil, fmt.Errorf("get visit: %w", err)
	}
	return v, nil
}

// ListByStage handles the ListByStageQuery. Returns visits sorted by date,
// then by position within the same date.
func (h *Handler) ListByStage(ctx context.Context, query ListByStageQuery) ([]*Visit, error) {
	visits, err := h.repo.ListByStage(ctx, query.StageID)
	if err != nil {
		return nil, fmt.Errorf("list visits by stage: %w", err)
	}

	sortByDateThenPosition(visits)

	return visits, nil
}

// ListByTrip handles the ListByTripQuery. Returns visits sorted by date,
// then by position within the same date.
func (h *Handler) ListByTrip(ctx context.Context, query ListByTripQuery) ([]*Visit, error) {
	visits, err := h.repo.ListByTrip(ctx, query.TripID)
	if err != nil {
		return nil, fmt.Errorf("list visits by trip: %w", err)
	}

	sortByDateThenPosition(visits)

	return visits, nil
}

func sortByDateThenPosition(visits []*Visit) {
	sort.Slice(visits, func(i, j int) bool {
		if !visits[i].Date.Equal(visits[j].Date) {
			return visits[i].Date.Before(visits[j].Date)
		}
		return visits[i].Position < visits[j].Position
	})
}

// Reorder handles the ReorderVisitsCommand.
func (h *Handler) Reorder(ctx context.Context, cmd ReorderVisitsCommand) ([]*Visit, error) {
	existing, err := h.repo.ListByStageAndDate(ctx, cmd.StageID, cmd.Date)
	if err != nil {
		return nil, fmt.Errorf("reorder visits: %w", err)
	}

	if len(existing) == 0 && len(cmd.VisitIDs) == 0 {
		return nil, nil
	}

	existingIDs := make(map[string]bool, len(existing))
	for _, v := range existing {
		existingIDs[v.ID] = true
	}
	if len(cmd.VisitIDs) != len(existingIDs) {
		return nil, fmt.Errorf("reorder visits: %w", ErrReorderIDMismatch)
	}
	seen := make(map[string]bool, len(cmd.VisitIDs))
	for _, id := range cmd.VisitIDs {
		if !existingIDs[id] || seen[id] {
			return nil, fmt.Errorf("reorder visits: %w", ErrReorderIDMismatch)
		}
		seen[id] = true
	}

	if len(existing) > 0 {
		modifiable, err := h.tripChecker.IsModifiable(ctx, existing[0].TripID)
		if err != nil {
			return nil, fmt.Errorf("reorder visits: %w", err)
		}
		if !modifiable {
			return nil, fmt.Errorf("reorder visits: %w", ErrTripClosed)
		}
	}

	if err := h.repo.Reorder(ctx, cmd.StageID, cmd.Date, cmd.VisitIDs); err != nil {
		return nil, fmt.Errorf("reorder visits: %w", err)
	}

	result, err := h.repo.ListByStageAndDate(ctx, cmd.StageID, cmd.Date)
	if err != nil {
		return nil, fmt.Errorf("reorder visits: %w", err)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Position < result[j].Position
	})

	return result, nil
}
