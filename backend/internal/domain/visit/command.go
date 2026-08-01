package visit

import "time"

// AddVisitCommand contains the data needed to add a visit to a stage.
type AddVisitCommand struct {
	TripID      string
	StageID     string
	Date        time.Time
	Title       string
	Description string
	Lat         float64
	Lng         float64
}

// UpdateVisitCommand contains the data needed to update an existing visit.
type UpdateVisitCommand struct {
	ID          string
	Date        time.Time
	Title       string
	Description string
	Lat         float64
	Lng         float64
}

// DeleteVisitCommand identifies the visit to delete.
type DeleteVisitCommand struct {
	ID string
}

// ReorderVisitsCommand contains the new ordering for visits sharing a
// primary stage and date.
type ReorderVisitsCommand struct {
	StageID  string
	Date     time.Time
	VisitIDs []string
}

// AttachToStageCommand attaches an existing visit to an additional stage.
type AttachToStageCommand struct {
	VisitID string
	StageID string
}

// DetachFromStageCommand detaches a visit from a stage.
type DetachFromStageCommand struct {
	VisitID string
	StageID string
}
