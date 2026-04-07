package stage

// GetStageQuery identifies a single stage to retrieve.
type GetStageQuery struct {
	ID string
}

// ListByTripQuery retrieves all stages for a given trip.
type ListByTripQuery struct {
	TripID string
}
