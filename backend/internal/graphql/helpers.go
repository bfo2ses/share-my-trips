package graph

import (
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

const dateFormat = time.DateOnly

func toGraphQLTrip(t *trip.Trip) *Trip {
	return &Trip{
		ID:          t.ID,
		Title:       t.Title,
		Country:     t.Country,
		Description: t.Description,
		CoverPhoto:  t.CoverPhoto,
		StartDate:   formatDate(t.StartDate),
		EndDate:     formatDate(t.EndDate),
		Status:      toGraphQLStatus(t.Status),
		CreatedAt:   t.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   t.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func formatDate(t time.Time) *string {
	if t.IsZero() {
		return nil
	}
	s := t.Format(dateFormat)
	return &s
}

func toGraphQLStatus(s trip.Status) TripStatus {
	switch s {
	case trip.StatusPublished:
		return TripStatusPublished
	case trip.StatusClosed:
		return TripStatusClosed
	default:
		return TripStatusDraft
	}
}

func todomainStatus(s TripStatus) trip.Status {
	switch s {
	case TripStatusPublished:
		return trip.StatusPublished
	case TripStatusClosed:
		return trip.StatusClosed
	default:
		return trip.StatusDraft
	}
}

func parseOptionalDate(s *string) (time.Time, error) {
	if s == nil || *s == "" {
		return time.Time{}, nil
	}
	return time.Parse(dateFormat, *s)
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
