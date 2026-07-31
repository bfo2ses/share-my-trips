package media

// GetMediaQuery identifies a single media to retrieve.
type GetMediaQuery struct {
	ID string
}

// ListByVisitQuery retrieves all media for a given visit, sorted by position.
type ListByVisitQuery struct {
	VisitID string
}

// ListByTripQuery retrieves all media for a given trip, across all its visits,
// sorted by visit then position.
type ListByTripQuery struct {
	TripID string
}
