package day

// GetDayQuery identifies a single day to retrieve.
type GetDayQuery struct {
	ID string
}

// ListByStageQuery retrieves all days for a given stage, sorted by date.
type ListByStageQuery struct {
	StageID string
}

// ListByTripQuery retrieves all days for a given trip.
type ListByTripQuery struct {
	TripID string
}
