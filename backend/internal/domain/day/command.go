package day

import "time"

// AddDayCommand contains the data needed to add a day to a stage.
type AddDayCommand struct {
	TripID      string
	StageID     string
	Date        time.Time
	Title       string
	Description string
	Lat         float64
	Lng         float64
}

// UpdateDayCommand contains the data needed to update an existing day.
type UpdateDayCommand struct {
	ID          string
	Date        time.Time
	Title       string
	Description string
	Lat         float64
	Lng         float64
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
