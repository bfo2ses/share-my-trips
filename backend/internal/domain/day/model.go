package day

import (
	"errors"
	"time"
)

// Domain errors.
var (
	ErrDateRequired      = errors.New("date is required")
	ErrGPSRequired       = errors.New("GPS coordinates are required")
	ErrNotFound          = errors.New("day not found")
	ErrTripClosed        = errors.New("trip is closed and cannot be modified")
	ErrMustBelongToStage = errors.New("day must belong to at least one stage")
	ErrAlreadyAttached   = errors.New("day is already attached to this stage")
	ErrNotAttached       = errors.New("day is not attached to this stage")
	ErrStageNotInTrip    = errors.New("stage does not belong to the trip")
)

// Day represents a single date within a stage of a trip.
// A day can belong to multiple stages.
type Day struct {
	ID          string
	TripID      string
	StageIDs    []string
	Date        time.Time
	Title       string
	Description string
	Lat         float64
	Lng         float64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// NewDay creates a new Day with validated fields.
func NewDay(id, tripID, stageID string, date time.Time, title, description string, lat, lng float64) (*Day, error) {
	if date.IsZero() {
		return nil, ErrDateRequired
	}
	if stageID == "" {
		return nil, ErrMustBelongToStage
	}
	// Phase 1: (0, 0) is used as a sentinel for "not provided". The geographic
	// origin (Gulf of Guinea) is excluded. Phase 2 will use *float64 pointers.
	if lat == 0 && lng == 0 {
		return nil, ErrGPSRequired
	}

	now := time.Now()
	return &Day{
		ID:          id,
		TripID:      tripID,
		StageIDs:    []string{stageID},
		Date:        date,
		Title:       title,
		Description: description,
		Lat:         lat,
		Lng:         lng,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Update modifies editable fields of the day.
func (d *Day) Update(date time.Time, title, description string, lat, lng float64) error {
	if date.IsZero() {
		return ErrDateRequired
	}
	// Same sentinel as NewDay — see note there.
	if lat == 0 && lng == 0 {
		return ErrGPSRequired
	}
	d.Date = date
	d.Title = title
	d.Description = description
	d.Lat = lat
	d.Lng = lng
	d.UpdatedAt = time.Now()
	return nil
}

// AttachToStage adds a stage to this day. Returns an error if already attached.
func (d *Day) AttachToStage(stageID string) error {
	for _, id := range d.StageIDs {
		if id == stageID {
			return ErrAlreadyAttached
		}
	}
	d.StageIDs = append(d.StageIDs, stageID)
	d.UpdatedAt = time.Now()
	return nil
}

// DetachFromStage removes a stage from this day.
// Returns ErrNotAttached if the stage is not linked.
// Returns ErrMustBelongToStage if this is the last stage.
func (d *Day) DetachFromStage(stageID string) error {
	found := false
	for _, id := range d.StageIDs {
		if id == stageID {
			found = true
			break
		}
	}
	if !found {
		return ErrNotAttached
	}
	if len(d.StageIDs) <= 1 {
		return ErrMustBelongToStage
	}

	newIDs := make([]string, 0, len(d.StageIDs)-1)
	for _, id := range d.StageIDs {
		if id != stageID {
			newIDs = append(newIDs, id)
		}
	}
	d.StageIDs = newIDs
	d.UpdatedAt = time.Now()
	return nil
}

// HasStage returns true if the day is attached to the given stage.
func (d *Day) HasStage(stageID string) bool {
	for _, id := range d.StageIDs {
		if id == stageID {
			return true
		}
	}
	return false
}
