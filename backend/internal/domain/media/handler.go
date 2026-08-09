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
	legChecker   TravelLegChecker
}

// NewHandler creates a new media Handler.
// The optional travel-leg checker keeps visit-only server wiring compatible
// while allowing a fully owner-aware handler once travel legs are wired.
func NewHandler(repo Repository, storage Storage, tripChecker TripChecker, visitChecker VisitChecker, legChecker ...TravelLegChecker) *Handler {
	handler := &Handler{
		repo:         repo,
		storage:      storage,
		tripChecker:  tripChecker,
		visitChecker: visitChecker,
	}
	if len(legChecker) > 0 {
		handler.legChecker = legChecker[0]
	}
	return handler
}

// --- Commands ---

// Add handles the AddMediaCommand.
func (h *Handler) Add(ctx context.Context, cmd AddMediaCommand) (*Media, error) {
	owner, tripID, err := h.resolveOwner(ctx, Owner{VisitID: cmd.VisitID, TravelLegID: cmd.TravelLegID})
	if err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}
	if cmd.TripID != "" && cmd.TripID != tripID {
		return nil, fmt.Errorf("add media: %w", ErrTripMismatch)
	}

	modifiable, err := h.tripChecker.IsModifiable(ctx, tripID)
	if err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}
	if !modifiable {
		return nil, fmt.Errorf("add media: %w", ErrTripClosed)
	}

	pos, err := h.repo.NextPositionForOwner(ctx, owner)
	if err != nil {
		return nil, fmt.Errorf("add media: %w", err)
	}

	id := uuid.New().String()
	m, err := newMedia(id, tripID, owner, cmd.Filename, cmd.ContentType, pos)
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
	return h.reorder(ctx, VisitOwner(cmd.VisitID), cmd.MediaIDs)
}

// ReorderTravelLeg changes the ordering of a saved travel leg's media.
func (h *Handler) ReorderTravelLeg(ctx context.Context, cmd ReorderTravelLegCommand) ([]*Media, error) {
	return h.reorder(ctx, TravelLegOwner(cmd.TravelLegID), cmd.MediaIDs)
}

func (h *Handler) reorder(ctx context.Context, owner Owner, mediaIDs []string) ([]*Media, error) {
	existing, err := h.repo.ListByOwner(ctx, owner)
	if err != nil {
		return nil, fmt.Errorf("reorder media: %w", err)
	}

	if len(existing) == 0 && len(mediaIDs) == 0 {
		return nil, nil
	}

	// Verify all IDs match.
	existingIDs := make(map[string]bool, len(existing))
	for _, m := range existing {
		existingIDs[m.ID] = true
	}
	if len(mediaIDs) != len(existingIDs) {
		return nil, fmt.Errorf("reorder media: %w", ErrIDMismatch)
	}
	for _, id := range mediaIDs {
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

	if err := h.repo.ReorderForOwner(ctx, owner, mediaIDs); err != nil {
		return nil, fmt.Errorf("reorder media: %w", err)
	}

	result, err := h.repo.ListByOwner(ctx, owner)
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

	if err := h.storage.Delete(m.ID, m.TripID, m.Owner(), m.Ext()); err != nil {
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

// ListByTravelLeg handles the owner-aware travel-leg media query.
func (h *Handler) ListByTravelLeg(ctx context.Context, query ListByTravelLegQuery) ([]*Media, error) {
	items, err := h.repo.ListByTravelLeg(ctx, query.TravelLegID)
	if err != nil {
		return nil, fmt.Errorf("list media by travel leg: %w", err)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Position < items[j].Position })
	return items, nil
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
		ownerI, ownerJ := media[i].Owner(), media[j].Owner()
		if ownerI.ID() != ownerJ.ID() || ownerI.IsVisit() != ownerJ.IsVisit() {
			if ownerI.IsVisit() != ownerJ.IsVisit() {
				return ownerI.IsVisit()
			}
			return ownerI.ID() < ownerJ.ID()
		}
		return media[i].Position < media[j].Position
	})

	return media, nil
}

func (h *Handler) resolveOwner(ctx context.Context, owner Owner) (Owner, string, error) {
	if err := owner.Validate(); err != nil {
		return Owner{}, "", err
	}
	if owner.IsVisit() {
		exists, err := h.visitChecker.Exists(ctx, owner.VisitID)
		if err != nil {
			return Owner{}, "", err
		}
		if !exists {
			return Owner{}, "", ErrVisitNotFound
		}
		tripID, err := h.visitChecker.TripID(ctx, owner.VisitID)
		if err != nil {
			return Owner{}, "", err
		}
		return owner, tripID, nil
	}
	if h.legChecker == nil {
		return Owner{}, "", ErrTravelLegNotFound
	}
	exists, err := h.legChecker.Exists(ctx, owner.TravelLegID)
	if err != nil {
		return Owner{}, "", err
	}
	if !exists {
		return Owner{}, "", ErrTravelLegNotFound
	}
	tripID, err := h.legChecker.TripID(ctx, owner.TravelLegID)
	if err != nil {
		return Owner{}, "", err
	}
	return owner, tripID, nil
}
