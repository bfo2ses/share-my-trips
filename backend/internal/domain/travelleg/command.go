package travelleg

// CreateTravelLegCommand contains the data needed to create a travel leg.
type CreateTravelLegCommand struct {
	TripID      string
	FromStageID string
	ToStageID   string
	Transport   Transport
	Description string
	DistanceKm  *float64
}

// UpdateTravelLegCommand contains the editable data of a saved travel leg.
type UpdateTravelLegCommand struct {
	ID          string
	Transport   Transport
	Description string
	DistanceKm  *float64
}

// MoveTravelLegCommand moves a saved leg to a different adjacent stage pair.
type MoveTravelLegCommand struct {
	ID          string
	FromStageID string
	ToStageID   string
}

// DeleteTravelLegCommand identifies a travel leg to delete.
type DeleteTravelLegCommand struct {
	ID string
}
