package travelleg

import (
	"errors"
	"math"
	"time"
)

// Domain errors.
var (
	ErrNotFound                       = errors.New("travel leg not found")
	ErrTripClosed                     = errors.New("trip is closed and cannot be modified")
	ErrInvalidTransport               = errors.New("invalid transport")
	ErrInvalidDistance                = errors.New("distance must be non-negative")
	ErrStageNotInTrip                 = errors.New("stage does not belong to the trip")
	ErrStagesNotConsecutive           = errors.New("stages are not consecutive")
	ErrPairAlreadyExists              = errors.New("a travel leg already exists for this stage pair")
	ErrInvalidTravelLeg               = errors.New("invalid travel leg")
	ErrIncompleteResolutionPlan       = errors.New("resolution plan does not cover every invalidated travel leg")
	ErrDuplicateResolution            = errors.New("travel leg has more than one resolution")
	ErrResolutionForValidLeg          = errors.New("resolution targets a travel leg that remains valid")
	ErrInvalidResolution              = errors.New("invalid travel leg resolution")
	ErrResolutionTargetNotConsecutive = errors.New("resolution target stages are not consecutive")
	ErrDuplicateResolutionTarget      = errors.New("more than one resolution uses the same target pair")
	ErrResolutionTargetOccupied       = errors.New("resolution target pair already has a travel leg")
)

// Transport identifies the means of transport used for a travel leg.
type Transport string

const (
	TransportCar   Transport = "CAR"
	TransportTrain Transport = "TRAIN"
	TransportPlane Transport = "PLANE"
	TransportBoat  Transport = "BOAT"
	TransportBus   Transport = "BUS"
)

// IsValid reports whether the transport is supported.
func (t Transport) IsValid() bool {
	switch t {
	case TransportCar, TransportTrain, TransportPlane, TransportBoat, TransportBus:
		return true
	default:
		return false
	}
}

// TravelLeg represents the documented movement from one itinerary stage to
// the next. DistanceKm is optional because the editor may calculate or enter
// it after creating the leg.
type TravelLeg struct {
	ID          string
	TripID      string
	FromStageID string
	ToStageID   string
	Transport   Transport
	Description string
	DistanceKm  *float64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// NewTravelLeg creates a travel leg whose pair validity is checked by Handler
// against the current itinerary sequence.
func NewTravelLeg(id, tripID, fromStageID, toStageID string, transport Transport, description string, distanceKm *float64) (*TravelLeg, error) {
	if !transport.IsValid() {
		return nil, ErrInvalidTransport
	}
	if err := validateDistance(distanceKm); err != nil {
		return nil, err
	}

	now := time.Now()
	return &TravelLeg{
		ID:          id,
		TripID:      tripID,
		FromStageID: fromStageID,
		ToStageID:   toStageID,
		Transport:   transport,
		Description: description,
		DistanceKm:  cloneDistance(distanceKm),
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Update changes the editable content of a travel leg.
func (l *TravelLeg) Update(transport Transport, description string, distanceKm *float64) error {
	if !transport.IsValid() {
		return ErrInvalidTransport
	}
	if err := validateDistance(distanceKm); err != nil {
		return err
	}
	l.Transport = transport
	l.Description = description
	l.DistanceKm = cloneDistance(distanceKm)
	l.UpdatedAt = time.Now()
	return nil
}

// Move changes the stage pair after Handler has validated the itinerary.
func (l *TravelLeg) Move(fromStageID, toStageID string) {
	l.FromStageID = fromStageID
	l.ToStageID = toStageID
	l.UpdatedAt = time.Now()
}

// SetDistance replaces the persisted distance after a calculation. A nil
// distance is valid and represents an unavailable or intentionally omitted
// value.
func (l *TravelLeg) SetDistance(distanceKm *float64) error {
	if err := validateDistance(distanceKm); err != nil {
		return err
	}
	l.DistanceKm = cloneDistance(distanceKm)
	l.UpdatedAt = time.Now()
	return nil
}

// ClearDistance removes a stale value when a subsequent automatic
// recalculation fails. The calculator itself is intentionally outside this
// pure domain package.
func (l *TravelLeg) ClearDistance() {
	_ = l.SetDistance(nil)
}

func validateDistance(distanceKm *float64) error {
	if distanceKm == nil {
		return nil
	}
	if *distanceKm < 0 || math.IsNaN(*distanceKm) || math.IsInf(*distanceKm, 0) {
		return ErrInvalidDistance
	}
	return nil
}

func cloneDistance(distanceKm *float64) *float64 {
	if distanceKm == nil {
		return nil
	}
	copy := *distanceKm
	return &copy
}
