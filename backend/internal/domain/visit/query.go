package visit

// GetVisitQuery identifies a single visit to retrieve.
type GetVisitQuery struct {
	ID string
}

// ListByStageQuery retrieves all visits for a given stage, sorted by date.
type ListByStageQuery struct {
	StageID string
}

// ListByTripQuery retrieves all visits for a given trip.
type ListByTripQuery struct {
	TripID string
}
