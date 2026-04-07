package day

import "time"

// AddDayCommand contains the data needed to add a day to a stage.
type AddDayCommand struct {
	TripID      string
	StageID     string
	Date        time.Time
	Title       string
	Description string
}

// UpdateDayCommand contains the data needed to update an existing day.
type UpdateDayCommand struct {
	ID          string
	Title       string
	Description string
}

// DeleteDayCommand identifies the day to delete.
type DeleteDayCommand struct {
	ID string
}

// AttachToStageCommand attaches an existing day to an additional stage.
type AttachToStageCommand struct {
	DayID   string
	StageID string
}

// DetachFromStageCommand detaches a day from a stage.
type DetachFromStageCommand struct {
	DayID   string
	StageID string
}
