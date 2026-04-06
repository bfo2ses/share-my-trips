package trip

import (
	"context"
	"fmt"
	"sort"

	"github.com/google/uuid"
)

// Handler handles commands and queries for the trip context.
type Handler struct {
	repo Repository
}

// NewHandler creates a new trip Handler with the given repository.
func NewHandler(repo Repository) *Handler {
	return &Handler{repo: repo}
}

// --- Commands ---

// Create handles the CreateTripCommand.
func (h *Handler) Create(ctx context.Context, cmd CreateTripCommand) (*Trip, error) {
	id := uuid.New().String()

	t, err := NewTrip(id, cmd.Title, cmd.Country, cmd.Description, cmd.CoverPhoto, cmd.StartDate, cmd.EndDate)
	if err != nil {
		return nil, fmt.Errorf("create trip: %w", err)
	}

	if err := h.repo.Save(ctx, t); err != nil {
		return nil, fmt.Errorf("create trip: %w", err)
	}

	return t, nil
}

// Update handles the UpdateTripCommand.
func (h *Handler) Update(ctx context.Context, cmd UpdateTripCommand) (*Trip, error) {
	t, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("update trip: %w", err)
	}

	if err := t.Update(cmd.Title, cmd.Country, cmd.Description, cmd.CoverPhoto, cmd.StartDate, cmd.EndDate); err != nil {
		return nil, fmt.Errorf("update trip: %w", err)
	}

	if err := h.repo.Save(ctx, t); err != nil {
		return nil, fmt.Errorf("update trip: %w", err)
	}

	return t, nil
}

// Publish handles the PublishTripCommand.
func (h *Handler) Publish(ctx context.Context, cmd PublishTripCommand) (*Trip, error) {
	t, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("publish trip: %w", err)
	}

	if err := t.Publish(); err != nil {
		return nil, fmt.Errorf("publish trip: %w", err)
	}

	if err := h.repo.Save(ctx, t); err != nil {
		return nil, fmt.Errorf("publish trip: %w", err)
	}

	return t, nil
}

// Unpublish handles the UnpublishTripCommand.
func (h *Handler) Unpublish(ctx context.Context, cmd UnpublishTripCommand) (*Trip, error) {
	t, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("unpublish trip: %w", err)
	}

	if err := t.Unpublish(); err != nil {
		return nil, fmt.Errorf("unpublish trip: %w", err)
	}

	if err := h.repo.Save(ctx, t); err != nil {
		return nil, fmt.Errorf("unpublish trip: %w", err)
	}

	return t, nil
}

// Close handles the CloseTripCommand.
func (h *Handler) Close(ctx context.Context, cmd CloseTripCommand) (*Trip, error) {
	t, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("close trip: %w", err)
	}

	if err := t.Close(cmd.FirstDay, cmd.LastDay); err != nil {
		return nil, fmt.Errorf("close trip: %w", err)
	}

	if err := h.repo.Save(ctx, t); err != nil {
		return nil, fmt.Errorf("close trip: %w", err)
	}

	return t, nil
}

// Reopen handles the ReopenTripCommand.
func (h *Handler) Reopen(ctx context.Context, cmd ReopenTripCommand) (*Trip, error) {
	t, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("reopen trip: %w", err)
	}

	if err := t.Reopen(); err != nil {
		return nil, fmt.Errorf("reopen trip: %w", err)
	}

	if err := h.repo.Save(ctx, t); err != nil {
		return nil, fmt.Errorf("reopen trip: %w", err)
	}

	return t, nil
}

// Delete handles the DeleteTripCommand.
func (h *Handler) Delete(ctx context.Context, cmd DeleteTripCommand) error {
	_, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return fmt.Errorf("delete trip: %w", err)
	}

	if err := h.repo.Delete(ctx, cmd.ID); err != nil {
		return fmt.Errorf("delete trip: %w", err)
	}

	return nil
}

// --- Queries ---

// GetByID handles the GetTripQuery.
func (h *Handler) GetByID(ctx context.Context, query GetTripQuery) (*Trip, error) {
	t, err := h.repo.FindByID(ctx, query.ID)
	if err != nil {
		return nil, fmt.Errorf("get trip: %w", err)
	}
	return t, nil
}

// List handles the ListTripsQuery. Returns trips sorted by start date descending.
func (h *Handler) List(ctx context.Context, query ListTripsQuery) ([]*Trip, error) {
	trips, err := h.repo.List(ctx, ListFilter{StatusIn: query.StatusIn})
	if err != nil {
		return nil, fmt.Errorf("list trips: %w", err)
	}

	sort.Slice(trips, func(i, j int) bool {
		return trips[i].StartDate.After(trips[j].StartDate)
	})

	return trips, nil
}
