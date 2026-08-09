package travelleg

// GetTravelLegQuery identifies a single travel leg.
type GetTravelLegQuery struct {
	ID string
}

// ListTravelLegsQuery retrieves all travel legs in a trip.
type ListTravelLegsQuery struct {
	TripID string
}
