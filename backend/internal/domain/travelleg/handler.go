package travelleg

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

// Handler handles travel-leg commands and queries.
type Handler struct {
	repo          Repository
	tripChecker   TripChecker
	stageSequence StageSequence
	mediaCleaner  MediaCleaner
}

// NewHandler creates a travel-leg handler.
func NewHandler(repo Repository, tripChecker TripChecker, stageSequence StageSequence, mediaCleaners ...MediaCleaner) *Handler {
	handler := &Handler{repo: repo, tripChecker: tripChecker, stageSequence: stageSequence}
	if len(mediaCleaners) > 0 {
		handler.mediaCleaner = mediaCleaners[0]
	}
	return handler
}

// Add creates a leg for a currently free adjacent stage pair.
func (h *Handler) Add(ctx context.Context, cmd CreateTravelLegCommand) (*TravelLeg, error) {
	if err := h.requireModifiable(ctx, cmd.TripID, "add travel leg"); err != nil {
		return nil, err
	}
	if err := h.validatePair(ctx, cmd.TripID, cmd.FromStageID, cmd.ToStageID); err != nil {
		return nil, fmt.Errorf("add travel leg: %w", err)
	}
	if err := h.ensurePairAvailable(ctx, cmd.TripID, cmd.FromStageID, cmd.ToStageID, ""); err != nil {
		return nil, fmt.Errorf("add travel leg: %w", err)
	}

	leg, err := NewTravelLeg(uuid.New().String(), cmd.TripID, cmd.FromStageID, cmd.ToStageID, cmd.Transport, cmd.Description, cmd.DistanceKm)
	if err != nil {
		return nil, fmt.Errorf("add travel leg: %w", err)
	}
	if err := h.repo.Save(ctx, leg); err != nil {
		return nil, fmt.Errorf("add travel leg: %w", err)
	}
	return leg, nil
}

// Update modifies a saved travel leg without changing its endpoints.
func (h *Handler) Update(ctx context.Context, cmd UpdateTravelLegCommand) (*TravelLeg, error) {
	leg, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("update travel leg: %w", err)
	}
	if err := h.requireModifiable(ctx, leg.TripID, "update travel leg"); err != nil {
		return nil, err
	}
	if err := leg.Update(cmd.Transport, cmd.Description, cmd.DistanceKm); err != nil {
		return nil, fmt.Errorf("update travel leg: %w", err)
	}
	if err := h.repo.Save(ctx, leg); err != nil {
		return nil, fmt.Errorf("update travel leg: %w", err)
	}
	return leg, nil
}

// Move changes the endpoints of a travel leg to a free adjacent pair.
func (h *Handler) Move(ctx context.Context, cmd MoveTravelLegCommand) (*TravelLeg, error) {
	leg, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return nil, fmt.Errorf("move travel leg: %w", err)
	}
	if err := h.requireModifiable(ctx, leg.TripID, "move travel leg"); err != nil {
		return nil, err
	}
	if err := h.validatePair(ctx, leg.TripID, cmd.FromStageID, cmd.ToStageID); err != nil {
		return nil, fmt.Errorf("move travel leg: %w", err)
	}
	if err := h.ensurePairAvailable(ctx, leg.TripID, cmd.FromStageID, cmd.ToStageID, leg.ID); err != nil {
		return nil, fmt.Errorf("move travel leg: %w", err)
	}

	leg.Move(cmd.FromStageID, cmd.ToStageID)
	if err := h.repo.Save(ctx, leg); err != nil {
		return nil, fmt.Errorf("move travel leg: %w", err)
	}
	return leg, nil
}

// SetDistance persists the output of a manual or automatic distance
// calculation. Passing nil deliberately clears a value that is no longer
// trustworthy after its route changed.
func (h *Handler) SetDistance(ctx context.Context, id string, distanceKm *float64) (*TravelLeg, error) {
	leg, err := h.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("set travel leg distance: %w", err)
	}
	if err := h.requireModifiable(ctx, leg.TripID, "set travel leg distance"); err != nil {
		return nil, err
	}
	if err := leg.SetDistance(distanceKm); err != nil {
		return nil, fmt.Errorf("set travel leg distance: %w", err)
	}
	if err := h.repo.Save(ctx, leg); err != nil {
		return nil, fmt.Errorf("set travel leg distance: %w", err)
	}
	return leg, nil
}

// Delete removes a saved travel leg and all its owned media.
func (h *Handler) Delete(ctx context.Context, cmd DeleteTravelLegCommand) error {
	leg, err := h.repo.FindByID(ctx, cmd.ID)
	if err != nil {
		return fmt.Errorf("delete travel leg: %w", err)
	}
	if err := h.requireModifiable(ctx, leg.TripID, "delete travel leg"); err != nil {
		return err
	}
	if h.mediaCleaner != nil {
		if err := h.mediaCleaner.DeleteTravelLegMedia(ctx, leg.ID); err != nil {
			return fmt.Errorf("delete travel leg media: %w", err)
		}
	}
	if err := h.repo.Delete(ctx, cmd.ID); err != nil {
		return fmt.Errorf("delete travel leg: %w", err)
	}
	return nil
}

// ApplyValidatedResolutions applies a resolution plan that has already been
// checked against a proposed itinerary by ValidateResolutionPlan. Keeping this
// narrow operation on the handler prevents API callers from reaching the
// repository directly while allowing the itinerary coordinator to apply a
// source change and its repairs as one guarded operation.
func (h *Handler) ApplyValidatedResolutions(ctx context.Context, resolutions []ItineraryResolution) error {
	for _, resolution := range resolutions {
		leg, err := h.repo.FindByID(ctx, resolution.TravelLegID)
		if err != nil {
			return fmt.Errorf("apply travel leg resolution: %w", err)
		}
		if err := h.requireModifiable(ctx, leg.TripID, "resolve travel leg"); err != nil {
			return err
		}

		switch resolution.Action {
		case ResolutionMove:
			leg.Move(resolution.FromStageID, resolution.ToStageID)
			if err := h.repo.Save(ctx, leg); err != nil {
				return fmt.Errorf("apply travel leg resolution: %w", err)
			}
		case ResolutionDelete:
			if err := h.Delete(ctx, DeleteTravelLegCommand{ID: leg.ID}); err != nil {
				return fmt.Errorf("apply travel leg resolution: %w", err)
			}
		default:
			return ErrInvalidResolution
		}
	}
	return nil
}

// RestoreResolvedLegs restores snapshots after a source itinerary write
// failed. It is intentionally only for the itinerary coordinator's rollback
// path; callers must have captured the legs before applying a validated plan.
func (h *Handler) RestoreResolvedLegs(ctx context.Context, legs []*TravelLeg) error {
	for _, leg := range legs {
		if leg == nil {
			return ErrInvalidTravelLeg
		}
		copy := *leg
		copy.DistanceKm = cloneDistance(leg.DistanceKm)
		if err := h.repo.Save(ctx, &copy); err != nil {
			return fmt.Errorf("restore travel leg resolution: %w", err)
		}
	}
	return nil
}

// GetByID retrieves one travel leg.
func (h *Handler) GetByID(ctx context.Context, query GetTravelLegQuery) (*TravelLeg, error) {
	leg, err := h.repo.FindByID(ctx, query.ID)
	if err != nil {
		return nil, fmt.Errorf("get travel leg: %w", err)
	}
	return leg, nil
}

// ListByTrip retrieves all travel legs for a trip.
func (h *Handler) ListByTrip(ctx context.Context, query ListTravelLegsQuery) ([]*TravelLeg, error) {
	legs, err := h.repo.ListByTrip(ctx, query.TripID)
	if err != nil {
		return nil, fmt.Errorf("list travel legs: %w", err)
	}
	return legs, nil
}

// ValidatePair verifies that endpoints form a currently consecutive pair. It
// is used by non-persisting calculations as well as create and move commands.
func (h *Handler) ValidatePair(ctx context.Context, tripID, fromStageID, toStageID string) error {
	return h.validatePair(ctx, tripID, fromStageID, toStageID)
}

// ValidateModifiable verifies that the trip remains editable without changing
// a leg. It is used by draft-only actions such as distance calculation.
func (h *Handler) ValidateModifiable(ctx context.Context, tripID string) error {
	return h.requireModifiable(ctx, tripID, "modify travel leg")
}

func (h *Handler) requireModifiable(ctx context.Context, tripID, operation string) error {
	modifiable, err := h.tripChecker.IsModifiable(ctx, tripID)
	if err != nil {
		return fmt.Errorf("%s: %w", operation, err)
	}
	if !modifiable {
		return fmt.Errorf("%s: %w", operation, ErrTripClosed)
	}
	return nil
}

func (h *Handler) validatePair(ctx context.Context, tripID, fromStageID, toStageID string) error {
	stages, err := h.stageSequence.OrderedStages(ctx, tripID)
	if err != nil {
		return err
	}

	fromIndex, toIndex := -1, -1
	for index, stage := range stages {
		if stage.TripID != tripID {
			continue
		}
		if stage.ID == fromStageID {
			fromIndex = index
		}
		if stage.ID == toStageID {
			toIndex = index
		}
	}
	if fromIndex == -1 || toIndex == -1 {
		return ErrStageNotInTrip
	}
	if toIndex != fromIndex+1 {
		return ErrStagesNotConsecutive
	}
	return nil
}

func (h *Handler) ensurePairAvailable(ctx context.Context, tripID, fromStageID, toStageID, ignoredLegID string) error {
	existing, err := h.repo.FindByStagePair(ctx, tripID, fromStageID, toStageID)
	if errors.Is(err, ErrNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	if existing.ID != ignoredLegID {
		return ErrPairAlreadyExists
	}
	return nil
}
