package stage

import (
	"errors"
	"time"
)

// Domain errors.
var (
	ErrCityRequired = errors.New("city is required")
	ErrGPSRequired  = errors.New("GPS coordinates are required")
	ErrNotFound     = errors.New("stage not found")
	ErrTripClosed   = errors.New("trip is closed and cannot be modified")
)

// Stage represents a geographic stop within a trip.
type Stage struct {
	ID          string
	TripID      string
	City        string
	Name        string
	Lat         float64
	Lng         float64
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// NewStage creates a new Stage with validated fields.
func NewStage(id, tripID, city, name string, lat, lng float64, description string) (*Stage, error) {
	if city == "" {
		return nil, ErrCityRequired
	}
	// Phase 1: (0, 0) is used as a sentinel for "not provided". The geographic
	// origin (Gulf of Guinea) is excluded. Phase 2 will use *float64 pointers.
	if lat == 0 && lng == 0 {
		return nil, ErrGPSRequired
	}

	now := time.Now()
	return &Stage{
		ID:          id,
		TripID:      tripID,
		City:        city,
		Name:        name,
		Lat:         lat,
		Lng:         lng,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// DisplayName returns the custom name if set, otherwise the city name.
func (s *Stage) DisplayName() string {
	if s.Name != "" {
		return s.Name
	}
	return s.City
}

// Update modifies editable fields of the stage.
func (s *Stage) Update(city, name string, lat, lng float64, description string) error {
	if city == "" {
		return ErrCityRequired
	}
	// Same sentinel as NewStage — see note there.
	if lat == 0 && lng == 0 {
		return ErrGPSRequired
	}

	s.City = city
	s.Name = name
	s.Lat = lat
	s.Lng = lng
	s.Description = description
	s.UpdatedAt = time.Now()
	return nil
}
