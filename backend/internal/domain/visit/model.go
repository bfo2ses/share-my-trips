package visit

import (
	"errors"
	"time"
)

// Domain errors.
var (
	ErrDateRequired      = errors.New("date is required")
	ErrGPSRequired       = errors.New("GPS coordinates are required")
	ErrNotFound          = errors.New("visit not found")
	ErrTripClosed        = errors.New("trip is closed and cannot be modified")
	ErrMustBelongToStage = errors.New("visit must belong to at least one stage")
	ErrAlreadyAttached   = errors.New("visit is already attached to this stage")
	ErrNotAttached       = errors.New("visit is not attached to this stage")
	ErrStageNotInTrip    = errors.New("stage does not belong to the trip")
	ErrReorderIDMismatch = errors.New("visit IDs do not match the day's visits")
)

// Visit represents a single dated stop within a stage of a trip.
// A visit can belong to multiple stages.
// Position orders visits sharing the same primary stage (StageIDs[0]) and Date.
type Visit struct {
	ID          string
	TripID      string
	StageIDs    []string
	Date        time.Time
	Title       string
	Description string
	Lat         float64
	Lng         float64
	Position    int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// NewVisit creates a new Visit with validated fields.
func NewVisit(id, tripID, stageID string, date time.Time, title, description string, lat, lng float64, position int) (*Visit, error) {
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
	return &Visit{
		ID:          id,
		TripID:      tripID,
		StageIDs:    []string{stageID},
		Date:        date,
		Title:       title,
		Description: description,
		Lat:         lat,
		Lng:         lng,
		Position:    position,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Update modifies editable fields of the visit.
func (v *Visit) Update(date time.Time, title, description string, lat, lng float64) error {
	if date.IsZero() {
		return ErrDateRequired
	}
	// Same sentinel as NewVisit — see note there.
	if lat == 0 && lng == 0 {
		return ErrGPSRequired
	}
	v.Date = date
	v.Title = title
	v.Description = description
	v.Lat = lat
	v.Lng = lng
	v.UpdatedAt = time.Now()
	return nil
}

// AttachToStage adds a stage to this visit. Returns an error if already attached.
func (v *Visit) AttachToStage(stageID string) error {
	for _, id := range v.StageIDs {
		if id == stageID {
			return ErrAlreadyAttached
		}
	}
	v.StageIDs = append(v.StageIDs, stageID)
	v.UpdatedAt = time.Now()
	return nil
}

// DetachFromStage removes a stage from this visit.
// Returns ErrNotAttached if the stage is not linked.
// Returns ErrMustBelongToStage if this is the last stage.
func (v *Visit) DetachFromStage(stageID string) error {
	found := false
	for _, id := range v.StageIDs {
		if id == stageID {
			found = true
			break
		}
	}
	if !found {
		return ErrNotAttached
	}
	if len(v.StageIDs) <= 1 {
		return ErrMustBelongToStage
	}

	newIDs := make([]string, 0, len(v.StageIDs)-1)
	for _, id := range v.StageIDs {
		if id != stageID {
			newIDs = append(newIDs, id)
		}
	}
	v.StageIDs = newIDs
	v.UpdatedAt = time.Now()
	return nil
}

// HasStage returns true if the visit is attached to the given stage.
func (v *Visit) HasStage(stageID string) bool {
	for _, id := range v.StageIDs {
		if id == stageID {
			return true
		}
	}
	return false
}
