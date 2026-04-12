package graph

import (
	"context"
	"fmt"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
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
		Lat:         t.Lat,
		Lng:         t.Lng,
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

func toGraphQLStage(s *stage.Stage) *Stage {
	var name *string
	if s.Name != "" {
		n := s.Name
		name = &n
	}
	return &Stage{
		ID:          s.ID,
		TripID:      s.TripID,
		City:        s.City,
		Name:        name,
		DisplayName: s.DisplayName(),
		Lat:         s.Lat,
		Lng:         s.Lng,
		Description: s.Description,
		CreatedAt:   s.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   s.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toGraphQLDay(d *day.Day) *Day {
	stageIDs := make([]string, len(d.StageIDs))
	copy(stageIDs, d.StageIDs)
	return &Day{
		ID:          d.ID,
		TripID:      d.TripID,
		StageIDs:    stageIDs,
		Date:        d.Date.Format(dateFormat),
		Title:       nullableString(d.Title),
		Description: nullableString(d.Description),
		Lat:         d.Lat,
		Lng:         d.Lng,
		CreatedAt:   d.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   d.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func nullableString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func toGraphQLAccount(u *auth.User) *Account {
	return &Account{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Role:      toGraphQLRole(u.Role),
		CreatedAt: u.CreatedAt.UTC().Format(time.RFC3339),
	}
}

// currentUserID resolves the session token in the context to a user ID.
func (r *Resolver) currentUserID(ctx context.Context) string {
	token := sessionTokenFromContext(ctx)
	if token == "" {
		return ""
	}
	user, err := r.authHandler.GetCurrentUser(ctx, auth.GetCurrentUserQuery{Token: token})
	if err != nil {
		return ""
	}
	return user.ID
}

func toGraphQLMedia(m *media.Media) *Media {
	return &Media{
		ID:          m.ID,
		DayID:       m.DayID,
		TripID:      m.TripID,
		Filename:    m.Filename,
		ContentType: m.ContentType,
		Caption:     nullableString(m.Caption),
		URL:         fmt.Sprintf("/media/%s", m.ID),
		ThumbURL:    fmt.Sprintf("/media/%s/thumb", m.ID),
		Position:    m.Position,
		CreatedAt:   m.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func toGraphQLMediaList(list []*media.Media) []*Media {
	result := make([]*Media, len(list))
	for i, m := range list {
		result[i] = toGraphQLMedia(m)
	}
	return result
}

func toGraphQLRole(r auth.Role) AccountRole {
	if r == auth.RoleAdmin {
		return AccountRoleAdmin
	}
	return AccountRoleFamily
}
