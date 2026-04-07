package stage

// AddStageCommand contains the data needed to add a stage to a trip.
type AddStageCommand struct {
	TripID      string
	City        string
	Name        string
	Lat         float64
	Lng         float64
	Description string
}

// UpdateStageCommand contains the data needed to update an existing stage.
type UpdateStageCommand struct {
	ID          string
	City        string
	Name        string
	Lat         float64
	Lng         float64
	Description string
}

// DeleteStageCommand identifies the stage to delete.
type DeleteStageCommand struct {
	ID string
}
