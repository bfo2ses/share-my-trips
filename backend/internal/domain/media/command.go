package media

// AddMediaCommand contains the data needed to add a media to a visit.
type AddMediaCommand struct {
	VisitID     string
	TravelLegID string
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

// ReorderTravelLegCommand contains the new ordering for a travel leg's media.
type ReorderTravelLegCommand struct {
	TravelLegID string
	MediaIDs    []string
}

// DeleteMediaCommand identifies the media to delete.
type DeleteMediaCommand struct {
	ID string
}

// MoveMediaCommand identifies media to move and their new owner.
type MoveMediaCommand struct {
	MediaIDs []string
	Owner    Owner
}
