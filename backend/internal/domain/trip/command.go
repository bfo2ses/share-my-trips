package trip

import "time"

// CreateTripCommand contains the data needed to create a new trip.
type CreateTripCommand struct {
	Title       string
	Country     string
	Description string
	CoverPhoto  string
	Lat         float64
	Lng         float64
	StartDate   time.Time
	EndDate     time.Time
}

// UpdateTripCommand contains the data needed to update an existing trip.
type UpdateTripCommand struct {
	ID          string
	Title       string
	Country     string
	Description string
	CoverPhoto  string
	Lat         float64
	Lng         float64
	StartDate   time.Time
	EndDate     time.Time
}

// PublishTripCommand identifies the trip to publish.
type PublishTripCommand struct {
	ID string
}

// UnpublishTripCommand identifies the trip to unpublish (back to draft).
type UnpublishTripCommand struct {
	ID string
}

// CloseTripCommand identifies the trip to close, with the computed date range.
type CloseTripCommand struct {
	ID       string
	FirstDay time.Time
	LastDay  time.Time
}

// ReopenTripCommand identifies the trip to reopen.
type ReopenTripCommand struct {
	ID string
}

// DeleteTripCommand identifies the trip to delete.
type DeleteTripCommand struct {
	ID string
}
