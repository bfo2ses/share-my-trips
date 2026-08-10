package media

// GetMediaQuery identifies a single media to retrieve.
type GetMediaQuery struct {
	ID string
}

// ListByVisitQuery retrieves all media for a given visit, sorted by position.
type ListByVisitQuery struct {
	VisitID string
}

// ListByTravelLegQuery identifies the travel leg whose media is listed.
type ListByTravelLegQuery struct {
	TravelLegID string
}

// ListByTripQuery retrieves all media for a given trip, across all its visits,
// sorted by visit then position.
type ListByTripQuery struct {
	TripID string
}
