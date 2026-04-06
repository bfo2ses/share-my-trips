package trip

// GetTripQuery identifies a single trip to retrieve.
type GetTripQuery struct {
	ID string
}

// ListTripsQuery defines filters for listing trips.
type ListTripsQuery struct {
	// StatusIn filters by status. Empty returns all trips.
	StatusIn []Status
}
