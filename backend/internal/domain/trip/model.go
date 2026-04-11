package trip

import (
	"errors"
	"fmt"
	"time"
)

// Status represents the lifecycle state of a trip.
type Status string

const (
	StatusDraft     Status = "draft"
	StatusPublished Status = "published"
	StatusClosed    Status = "closed"
)

// Domain errors.
var (
	ErrTitleRequired      = errors.New("title is required")
	ErrCountryRequired    = errors.New("country is required")
	ErrGPSRequired        = errors.New("GPS coordinates are required")
	ErrInvalidDates       = errors.New("end date must be after start date")
	ErrNotFound           = errors.New("trip not found")
	ErrAlreadyPublished   = errors.New("trip is already published")
	ErrAlreadyClosed      = errors.New("trip is already closed")
	ErrNotPublished       = errors.New("trip must be published to perform this action")
	ErrClosed             = errors.New("trip is closed and cannot be modified")
	ErrNoDaysToClose      = errors.New("trip must have at least one day to be closed")
	ErrCannotCloseDraft   = errors.New("cannot close a draft trip")
	ErrNotClosed          = errors.New("trip is not closed")
)

// Trip is the root aggregate for the trip context.
type Trip struct {
	ID          string
	Title       string
	Country     string
	Description string
	CoverPhoto  string
	Lat         float64
	Lng         float64
	StartDate   time.Time
	EndDate     time.Time
	Status      Status
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// NewTrip creates a new Trip in draft status with validated fields.
func NewTrip(id, title, country, description, coverPhoto string, lat, lng float64, startDate, endDate time.Time) (*Trip, error) {
	if title == "" {
		return nil, ErrTitleRequired
	}
	if country == "" {
		return nil, ErrCountryRequired
	}
	// Phase 1: (0, 0) is used as a sentinel for "not provided". The geographic
	// origin (Gulf of Guinea) is excluded. Phase 2 will use *float64 pointers.
	if lat == 0 && lng == 0 {
		return nil, ErrGPSRequired
	}
	if !endDate.IsZero() && !startDate.IsZero() && endDate.Before(startDate) {
		return nil, ErrInvalidDates
	}

	if coverPhoto == "" {
		coverPhoto = "default_cover.jpg"
	}

	now := time.Now()
	return &Trip{
		ID:          id,
		Title:       title,
		Country:     country,
		Description: description,
		CoverPhoto:  coverPhoto,
		Lat:         lat,
		Lng:         lng,
		StartDate:   startDate,
		EndDate:     endDate,
		Status:      StatusDraft,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Publish transitions the trip from draft to published.
func (t *Trip) Publish() error {
	if t.Status == StatusClosed {
		return ErrAlreadyClosed
	}
	if t.Status == StatusPublished {
		return ErrAlreadyPublished
	}
	t.Status = StatusPublished
	t.UpdatedAt = time.Now()
	return nil
}

// Unpublish transitions the trip from published back to draft.
func (t *Trip) Unpublish() error {
	if t.Status != StatusPublished {
		return ErrNotPublished
	}
	t.Status = StatusDraft
	t.UpdatedAt = time.Now()
	return nil
}

// Close transitions the trip from published to closed, recalculating dates
// from the actual first and last days.
func (t *Trip) Close(firstDay, lastDay time.Time) error {
	if t.Status == StatusDraft {
		return ErrCannotCloseDraft
	}
	if t.Status == StatusClosed {
		return ErrAlreadyClosed
	}
	if firstDay.IsZero() || lastDay.IsZero() {
		return ErrNoDaysToClose
	}
	t.Status = StatusClosed
	t.StartDate = firstDay
	t.EndDate = lastDay
	t.UpdatedAt = time.Now()
	return nil
}

// Reopen transitions the trip from closed back to published.
func (t *Trip) Reopen() error {
	if t.Status != StatusClosed {
		return fmt.Errorf("reopen: %w", ErrNotClosed)
	}
	t.Status = StatusPublished
	t.UpdatedAt = time.Now()
	return nil
}

// Update modifies editable fields of the trip. Returns an error if the trip is closed.
func (t *Trip) Update(title, country, description, coverPhoto string, lat, lng float64, startDate, endDate time.Time) error {
	if t.Status == StatusClosed {
		return ErrClosed
	}
	if title == "" {
		return ErrTitleRequired
	}
	if country == "" {
		return ErrCountryRequired
	}
	// Same sentinel as NewTrip — see note there.
	if lat == 0 && lng == 0 {
		return ErrGPSRequired
	}
	if !endDate.IsZero() && !startDate.IsZero() && endDate.Before(startDate) {
		return ErrInvalidDates
	}

	t.Title = title
	t.Country = country
	t.Description = description
	if coverPhoto != "" {
		t.CoverPhoto = coverPhoto
	}
	t.Lat = lat
	t.Lng = lng
	t.StartDate = startDate
	t.EndDate = endDate
	t.UpdatedAt = time.Now()
	return nil
}

// IsModifiable returns true if the trip can be edited.
func (t *Trip) IsModifiable() bool {
	return t.Status != StatusClosed
}
