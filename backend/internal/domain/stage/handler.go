package stage

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

// Handler handles commands and queries for the stage context.
type Handler struct {
	repo        Repository
	tripChecker TripChecker
	dayDetacher DayDetacher
}

// NewHandler creates a new stage Handler.
func NewHandler(repo Repository, tripChecker TripChecker, dayDetacher DayDetacher) *Handler {
	return &Handler{
		repo:        repo,
		tripChecker: tripChecker,
		dayDetacher: dayDetacher,
	}
}

// --- Commands ---

// Add handles the AddStageCommand.
func (h *Handler) Add(ctx context.Context, cmd AddStageCommand) (*Stage, error) {
	modifiable, err := h.tripChecker.IsModifiable(ctx, cmd.TripID)
	if err != nil {
		return nil, fmt.Errorf("add stage: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("add stage: %w", ErrTripClosed)
	}

	id := uuid.New().String()
	s, err := NewStage(id, cmd.TripID, cmd.City, cmd.Name, cmd.Lat, cmd.Lng, cmd.Description)
	if err != nil {
		return nil, fmt.Errorf("add stage: %w", err)
	}

	if err := h.repo.Save(ctx, s); err != nil {
		return nil, fmt.Errorf("add stage: %w", err)
	}

	return s, nil
}

// Update handles the UpdateStageCommand.
func (h *Handler) Update(ctx context.Context, cmd UpdateStageCommand) (*Stage, error) {
	s, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("update stage: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, s.TripID)
	if err != nil {
		return nil, fmt.Errorf("update stage: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("update stage: %w", ErrTripClosed)
	}

	if err := s.Update(cmd.City, cmd.Name, cmd.Lat, cmd.Lng, cmd.Description); err != nil {
		return nil, fmt.Errorf("update stage: %w", err)
	}

	if err := h.repo.Save(ctx, s); err != nil {
		return nil, fmt.Errorf("update stage: %w", err)
	}

	return s, nil
}

// Delete handles the DeleteStageCommand.
// It removes all day-stage links for this stage, deleting days that become orphaned.
func (h *Handler) Delete(ctx context.Context, cmd DeleteStageCommand) error {
	s, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return fmt.Errorf("delete stage: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, s.TripID)
	if err != nil {
		return fmt.Errorf("delete stage: %w", err)
	}
	if !modifiable {
		return fmt.Errorf("delete stage: %w", ErrTripClosed)
	}

	if err := h.dayDetacher.DetachStage(ctx, cmd.ID); err != nil {
		return fmt.Errorf("delete stage: %w", err)
	}

	if err := h.repo.Delete(ctx, cmd.ID); err != nil {
		return fmt.Errorf("delete stage: %w", err)
	}

	return nil
}

// --- Queries ---

// GetByID handles the GetStageQuery.
func (h *Handler) GetByID(ctx context.Context, query GetStageQuery) (*Stage, error) {
	s, err := h.repo.FindByID(ctx, query.ID)
	if err != nil {
		return nil, fmt.Errorf("get stage: %w", err)
	}
	return s, nil
}

// ListByTrip handles the ListByTripQuery.
func (h *Handler) ListByTrip(ctx context.Context, query ListByTripQuery) ([]*Stage, error) {
	stages, err := h.repo.ListByTrip(ctx, query.TripID)
	if err != nil {
		return nil, fmt.Errorf("list stages: %w", err)
	}
	return stages, nil
}
