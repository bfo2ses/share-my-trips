package media

import (
	"context"
	"fmt"
	"sort"

	"github.com/google/uuid"
)

// Handler handles commands and queries for the media context.
type Handler struct {
	repo         Repository
	storage      Storage
	tripChecker  TripChecker
	visitChecker VisitChecker
}

// NewHandler creates a new media Handler.
func NewHandler(repo Repository, storage Storage, tripChecker TripChecker, visitChecker VisitChecker) *Handler {
	return &Handler{
		repo:         repo,
		storage:      storage,
		tripChecker:  tripChecker,
		visitChecker: visitChecker,
	}
}

// --- Commands ---

// Add handles the AddMediaCommand.
func (h *Handler) Add(ctx context.Context, cmd AddMediaCommand) (*Media, error) {
	exists, err := h.visitChecker.Exists(ctx, cmd.VisitID)
	if err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}
	if !exists {
		return nil, fmt.Errorf("add media: %w", ErrVisitNotFound)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, cmd.TripID)
	if err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("add media: %w", ErrTripClosed)
	}

	pos, err := h.repo.NextPosition(ctx, cmd.VisitID)
	if err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}

	id := uuid.New().String()
	m, err := NewMedia(id, cmd.VisitID, cmd.TripID, cmd.Filename, cmd.ContentType, pos)
	if err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}

	if err := h.repo.Save(ctx, m); err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}

	return m, nil
}

// UpdateCaption handles the UpdateCaptionCommand.
func (h *Handler) UpdateCaption(ctx context.Context, cmd UpdateCaptionCommand) (*Media, error) {
	m, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("update media caption: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, m.TripID)
	if err != nil {
		return nil, fmt.Errorf("update media caption: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("update media caption: %w", ErrTripClosed)
	}

	m.UpdateCaption(cmd.Caption)

	if err := h.repo.Save(ctx, m); err != nil {
		return nil, fmt.Errorf("update media caption: %w", err)
	}

	return m, nil
}

// Reorder handles the ReorderCommand.
func (h *Handler) Reorder(ctx context.Context, cmd ReorderCommand) ([]*Media, error) {
	existing, err := h.repo.ListByVisit(ctx, cmd.VisitID)
	if err != nil {
		return nil, fmt.Errorf("reorder media: %w", err)
	}

	if len(existing) == 0 && len(cmd.MediaIDs) == 0 {
		return nil, nil
	}

	// Verify all IDs match.
	existingIDs := make(map[string]bool, len(existing))
	for _, m := range existing {
		existingIDs[m.ID] = true
	}
	if len(cmd.MediaIDs) != len(existingIDs) {
		return nil, fmt.Errorf("reorder media: %w", ErrIDMismatch)
	}
	for _, id := range cmd.MediaIDs {
		if !existingIDs[id] {
			return nil, fmt.Errorf("reorder media: %w", ErrIDMismatch)
		}
	}

	// Check trip modifiability using the first media's trip.
	if len(existing) > 0 {
		modifiable, err := h.tripChecker.IsModifiable(ctx, existing[0].TripID)
		if err != nil {
			return nil, fmt.Errorf("reorder media: %w", err)
		}
		if !modifiable {
			return nil, fmt.Errorf("reorder media: %w", ErrTripClosed)
		}
	}

	if err := h.repo.Reorder(ctx, cmd.VisitID, cmd.MediaIDs); err != nil {
		return nil, fmt.Errorf("reorder media: %w", err)
	}

	result, err := h.repo.ListByVisit(ctx, cmd.VisitID)
	if err != nil {
		return nil, fmt.Errorf("reorder media: %w", err)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Position < result[j].Position
	})

	return result, nil
}

// Delete handles the DeleteMediaCommand.
func (h *Handler) Delete(ctx context.Context, cmd DeleteMediaCommand) error {
	m, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return fmt.Errorf("delete media: %w", err)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, m.TripID)
	if err != nil {
		return fmt.Errorf("delete media: %w", err)
	}
	if !modifiable {
		return fmt.Errorf("delete media: %w", ErrTripClosed)
	}

	if err := h.storage.Delete(m.ID, m.TripID, m.VisitID, m.Ext()); err != nil {
		return fmt.Errorf("delete media: %w", err)
	}

	if err := h.repo.Delete(ctx, cmd.ID); err != nil {
		return fmt.Errorf("delete media: %w", err)
	}

	return nil
}

// --- Queries ---

// GetByID handles the GetMediaQuery.
func (h *Handler) GetByID(ctx context.Context, query GetMediaQuery) (*Media, error) {
	m, err := h.repo.FindByID(ctx, query.ID)
	if err != nil {
		return nil, fmt.Errorf("get media: %w", err)
	}
	return m, nil
}

// ListByVisit handles the ListByVisitQuery. Returns media sorted by position.
func (h *Handler) ListByVisit(ctx context.Context, query ListByVisitQuery) ([]*Media, error) {
	media, err := h.repo.ListByVisit(ctx, query.VisitID)
	if err != nil {
		return nil, fmt.Errorf("list media by visit: %w", err)
	}

	sort.Slice(media, func(i, j int) bool {
		return media[i].Position < media[j].Position
	})

	return media, nil
}

// ListByTrip handles the ListByTripQuery. Returns media across all the trip's
// visits, grouped by visit (stable but arbitrary visit order — visit IDs are
// UUIDs, not chronological), sorted by position within each visit.
func (h *Handler) ListByTrip(ctx context.Context, query ListByTripQuery) ([]*Media, error) {
	media, err := h.repo.ListByTrip(ctx, query.TripID)
	if err != nil {
		return nil, fmt.Errorf("list media by trip: %w", err)
	}

	sort.Slice(media, func(i, j int) bool {
		if media[i].VisitID != media[j].VisitID {
			return media[i].VisitID < media[j].VisitID
		}
		return media[i].Position < media[j].Position
	})

	return media, nil
}
