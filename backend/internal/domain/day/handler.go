package day

import (
	"context"
	"fmt"
	"sort"

	"github.com/google/uuid"
)

// Handler handles commands and queries for the day context.
type Handler struct {
	repo         Repository
	tripChecker  TripChecker
	stageChecker StageChecker
}

// NewHandler creates a new day Handler.
func NewHandler(repo Repository, tripChecker TripChecker, stageChecker StageChecker) *Handler {
	return &Handler{
		repo:         repo,
		tripChecker:  tripChecker,
		stageChecker: stageChecker,
	}
}

// --- Commands ---

// Add handles the AddDayCommand.
func (h *Handler) Add(ctx context.Context, cmd AddDayCommand) (*Day, error) {
	modifiable, err := h.tripChecker.IsModifiable(ctx, cmd.TripID)
	if err != nil {
		return nil, fmt.Errorf("add day: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("add day: %w", ErrTripClosed)
	}

	ok, err := h.stageChecker.BelongsToTrip(ctx, cmd.StageID, cmd.TripID)
	if err != nil {
		return nil, fmt.Errorf("add day: %w", err)
	}
	if !ok {
		return nil, fmt.Errorf("add day: %w", ErrStageNotInTrip)
	}

	id := uuid.New().String()
	d, err := NewDay(id, cmd.TripID, cmd.StageID, cmd.Date, cmd.Title, cmd.Description, cmd.Lat, cmd.Lng)
	if err != nil {
		return nil, fmt.Errorf("add day: %w", err)
	}

	if err := h.repo.Save(ctx, d); err != nil {
		return nil, fmt.Errorf("add day: %w", err)
	}

	return d, nil
}

// Update handles the UpdateDayCommand.
func (h *Handler) Update(ctx context.Context, cmd UpdateDayCommand) (*Day, error) {
	d, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("update day: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, d.TripID)
	if err != nil {
		return nil, fmt.Errorf("update day: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("update day: %w", ErrTripClosed)
	}

	if err := d.Update(cmd.Date, cmd.Title, cmd.Description, cmd.Lat, cmd.Lng); err != nil {
		return nil, fmt.Errorf("update day: %w", err)
	}

	if err := h.repo.Save(ctx, d); err != nil {
		return nil, fmt.Errorf("update day: %w", err)
	}

	return d, nil
}

// Delete handles the DeleteDayCommand.
func (h *Handler) Delete(ctx context.Context, cmd DeleteDayCommand) error {
	d, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return fmt.Errorf("delete day: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, d.TripID)
	if err != nil {
		return fmt.Errorf("delete day: %w", err)
	}
	if !modifiable {
		return fmt.Errorf("delete day: %w", ErrTripClosed)
	}

	if err := h.repo.Delete(ctx, cmd.ID); err != nil {
		return fmt.Errorf("delete day: %w", err)
	}

	return nil
}

// AttachToStage handles the AttachToStageCommand.
func (h *Handler) AttachToStage(ctx context.Context, cmd AttachToStageCommand) (*Day, error) {
	d, err := h.repo.FindByID(ctx, cmd.DayID)
	if err != nil {
		return nil, fmt.Errorf("attach day to stage: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, d.TripID)
	if err != nil {
		return nil, fmt.Errorf("attach day to stage: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("attach day to stage: %w", ErrTripClosed)
	}

	belongs, err := h.stageChecker.BelongsToTrip(ctx, cmd.StageID, d.TripID)
	if err != nil {
		return nil, fmt.Errorf("attach day to stage: %w", err)
	}
	if !belongs {
		return nil, fmt.Errorf("attach day to stage: %w", ErrStageNotInTrip)
	}

	if err := d.AttachToStage(cmd.StageID); err != nil {
		return nil, fmt.Errorf("attach day to stage: %w", err)
	}

	if err := h.repo.Save(ctx, d); err != nil {
		return nil, fmt.Errorf("attach day to stage: %w", err)
	}

	return d, nil
}

// DetachFromStage handles the DetachFromStageCommand.
func (h *Handler) DetachFromStage(ctx context.Context, cmd DetachFromStageCommand) (*Day, error) {
	d, err := h.repo.FindByID(ctx, cmd.DayID)
	if err != nil {
		return nil, fmt.Errorf("detach day from stage: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, d.TripID)
	if err != nil {
		return nil, fmt.Errorf("detach day from stage: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("detach day from stage: %w", ErrTripClosed)
	}

	if err := d.DetachFromStage(cmd.StageID); err != nil {
		return nil, fmt.Errorf("detach day from stage: %w", err)
	}

	if err := h.repo.Save(ctx, d); err != nil {
		return nil, fmt.Errorf("detach day from stage: %w", err)
	}

	return d, nil
}

// --- Queries ---

// GetByID handles the GetDayQuery.
func (h *Handler) GetByID(ctx context.Context, query GetDayQuery) (*Day, error) {
	d, err := h.repo.FindByID(ctx, query.ID)
	if err != nil {
		return nil, fmt.Errorf("get day: %w", err)
	}
	return d, nil
}

// ListByStage handles the ListByStageQuery. Returns days sorted by date ascending.
func (h *Handler) ListByStage(ctx context.Context, query ListByStageQuery) ([]*Day, error) {
	days, err := h.repo.ListByStage(ctx, query.StageID)
	if err != nil {
		return nil, fmt.Errorf("list days by stage: %w", err)
	}

	sort.Slice(days, func(i, j int) bool {
		return days[i].Date.Before(days[j].Date)
	})

	return days, nil
}

// ListByTrip handles the ListByTripQuery. Returns days sorted by date ascending.
func (h *Handler) ListByTrip(ctx context.Context, query ListByTripQuery) ([]*Day, error) {
	days, err := h.repo.ListByTrip(ctx, query.TripID)
	if err != nil {
		return nil, fmt.Errorf("list days by trip: %w", err)
	}

	sort.Slice(days, func(i, j int) bool {
		return days[i].Date.Before(days[j].Date)
	})

	return days, nil
}
