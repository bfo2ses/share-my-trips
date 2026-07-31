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

	id := uuid.New().String()
	v, err := NewVisit(id, cmd.TripID, cmd.StageID, cmd.Date, cmd.Title, cmd.Description, cmd.Lat, cmd.Lng)
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

	if err := v.Update(cmd.Date, cmd.Title, cmd.Description, cmd.Lat, cmd.Lng); err != nil {
		return nil, fmt.Errorf("update visit: %w", err)
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

	if err := v.DetachFromStage(cmd.StageID); err != nil {
		return nil, fmt.Errorf("detach visit from stage: %w", err)
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

// ListByStage handles the ListByStageQuery. Returns visits sorted by date ascending.
func (h *Handler) ListByStage(ctx context.Context, query ListByStageQuery) ([]*Visit, error) {
	visits, err := h.repo.ListByStage(ctx, query.StageID)
	if err != nil {
		return nil, fmt.Errorf("list visits by stage: %w", err)
	}

	sort.Slice(visits, func(i, j int) bool {
		return visits[i].Date.Before(visits[j].Date)
	})

	return visits, nil
}

// ListByTrip handles the ListByTripQuery. Returns visits sorted by date ascending.
func (h *Handler) ListByTrip(ctx context.Context, query ListByTripQuery) ([]*Visit, error) {
	visits, err := h.repo.ListByTrip(ctx, query.TripID)
	if err != nil {
		return nil, fmt.Errorf("list visits by trip: %w", err)
	}

	sort.Slice(visits, func(i, j int) bool {
		return visits[i].Date.Before(visits[j].Date)
	})

	return visits, nil
}
