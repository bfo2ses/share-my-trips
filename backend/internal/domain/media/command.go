package media

// AddMediaCommand contains the data needed to add a media to a visit.
type AddMediaCommand struct {
	VisitID     string
	TripID      string
	Filename    string
	ContentType string
}

// UpdateCaptionCommand contains the data needed to update a media's caption.
type UpdateCaptionCommand struct {
	ID      string
	Caption string
}

// ReorderCommand contains the new ordering for media in a visit.
type ReorderCommand struct {
	VisitID  string
	MediaIDs []string
}

// DeleteMediaCommand identifies the media to delete.
type DeleteMediaCommand struct {
	ID string
}
