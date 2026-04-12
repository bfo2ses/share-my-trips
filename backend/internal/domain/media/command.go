package media

// AddMediaCommand contains the data needed to add a media to a day.
type AddMediaCommand struct {
	DayID       string
	TripID      string
	Filename    string
	ContentType string
}

// UpdateCaptionCommand contains the data needed to update a media's caption.
type UpdateCaptionCommand struct {
	ID      string
	Caption string
}

// ReorderCommand contains the new ordering for media in a day.
type ReorderCommand struct {
	DayID    string
	MediaIDs []string
}

// DeleteMediaCommand identifies the media to delete.
type DeleteMediaCommand struct {
	ID string
}
