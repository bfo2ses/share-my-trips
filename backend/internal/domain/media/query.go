package media

// GetMediaQuery identifies a single media to retrieve.
type GetMediaQuery struct {
	ID string
}

// ListByDayQuery retrieves all media for a given day, sorted by position.
type ListByDayQuery struct {
	DayID string
}
