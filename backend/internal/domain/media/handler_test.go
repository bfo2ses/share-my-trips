package media_test

import (
	"context"
	"sort"
	"testing"

	"io"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bfosses/sharemytrips/internal/domain/media"
)

// --- Test doubles ---

type stubTripChecker struct {
	closedTripIDs map[string]bool
}

func newStubTripChecker() *stubTripChecker {
	return &stubTripChecker{closedTripIDs: make(map[string]bool)}
}

func (s *stubTripChecker) IsModifiable(_ context.Context, tripID string) (bool, error) {
	return !s.closedTripIDs[tripID], nil
}

type stubVisitChecker struct {
	visits map[string]string // visitID -> tripID
}

type stubTravelLegChecker struct {
	legs map[string]string // travelLegID -> tripID
}

func newStubTravelLegChecker() *stubTravelLegChecker {
	return &stubTravelLegChecker{legs: make(map[string]string)}
}

func (s *stubTravelLegChecker) Exists(_ context.Context, legID string) (bool, error) {
	_, ok := s.legs[legID]
	return ok, nil
}

func (s *stubTravelLegChecker) TripID(_ context.Context, legID string) (string, error) {
	tripID, ok := s.legs[legID]
	if !ok {
		return "", media.ErrTravelLegNotFound
	}
	return tripID, nil
}

func newStubVisitChecker() *stubVisitChecker {
	return &stubVisitChecker{visits: make(map[string]string)}
}

func (s *stubVisitChecker) Exists(_ context.Context, visitID string) (bool, error) {
	_, ok := s.visits[visitID]
	return ok, nil
}

func (s *stubVisitChecker) TripID(_ context.Context, visitID string) (string, error) {
	tid, ok := s.visits[visitID]
	if !ok {
		return "", media.ErrVisitNotFound
	}
	return tid, nil
}

type stubStorage struct {
	deleted map[string]bool
}

func newStubStorage() *stubStorage {
	return &stubStorage{deleted: make(map[string]bool)}
}

func (s *stubStorage) Store(id, tripID string, owner media.Owner, ext string, _ io.Reader) error {
	return nil
}
func (s *stubStorage) Delete(id, tripID string, owner media.Owner, ext string) error {
	s.deleted[id] = true
	return nil
}
func (s *stubStorage) Move(_ string, _ string, _ media.Owner, _ media.Owner, _ string) error {
	return nil
}
func (s *stubStorage) FilePath(id, tripID string, owner media.Owner, ext string) string { return "" }
func (s *stubStorage) ThumbPath(id, tripID string, owner media.Owner) string            { return "" }

// mediaRepository is an in-memory media.Repository for tests.
type mediaRepository struct {
	media map[string]*media.Media
}

func newMediaRepository() *mediaRepository {
	return &mediaRepository{media: make(map[string]*media.Media)}
}

func (r *mediaRepository) Save(_ context.Context, m *media.Media) error {
	cp := *m
	r.media[m.ID] = &cp
	return nil
}

func (r *mediaRepository) FindByID(_ context.Context, id string) (*media.Media, error) {
	m, ok := r.media[id]
	if !ok {
		return nil, media.ErrNotFound
	}
	cp := *m
	return &cp, nil
}

func (r *mediaRepository) ListByVisit(_ context.Context, visitID string) ([]*media.Media, error) {
	return r.ListByOwner(context.Background(), media.VisitOwner(visitID))
}

func (r *mediaRepository) ListByTravelLeg(_ context.Context, travelLegID string) ([]*media.Media, error) {
	return r.ListByOwner(context.Background(), media.TravelLegOwner(travelLegID))
}

func (r *mediaRepository) ListByOwner(_ context.Context, owner media.Owner) ([]*media.Media, error) {
	var result []*media.Media
	for _, m := range r.media {
		if m.Owner() == owner {
			cp := *m
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *mediaRepository) ListByTrip(_ context.Context, tripID string) ([]*media.Media, error) {
	var result []*media.Media
	for _, m := range r.media {
		if m.TripID == tripID {
			cp := *m
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *mediaRepository) Delete(_ context.Context, id string) error {
	if _, ok := r.media[id]; !ok {
		return media.ErrNotFound
	}
	delete(r.media, id)
	return nil
}

func (r *mediaRepository) Move(_ context.Context, mediaIDs []string, destination media.Owner) error {
	selected := make([]*media.Media, 0, len(mediaIDs))
	seen := make(map[string]struct{}, len(mediaIDs))
	for _, id := range mediaIDs {
		if _, ok := seen[id]; ok {
			return media.ErrIDMismatch
		}
		seen[id] = struct{}{}
		item, ok := r.media[id]
		if !ok {
			return media.ErrNotFound
		}
		selected = append(selected, item)
	}
	if len(selected) == 0 {
		return media.ErrMediaRequired
	}
	source := selected[0].Owner()
	maxPosition := -1
	for _, item := range r.media {
		if item.Owner() == destination && item.Position > maxPosition {
			maxPosition = item.Position
		}
	}
	for position, item := range selected {
		item.VisitID = destination.VisitID
		item.TravelLegID = destination.TravelLegID
		item.Position = maxPosition + position + 1
	}
	remaining := make([]*media.Media, 0)
	for _, item := range r.media {
		if item.Owner() == source {
			if _, moved := seen[item.ID]; !moved {
				remaining = append(remaining, item)
			}
		}
	}
	sort.Slice(remaining, func(i, j int) bool {
		if remaining[i].Position == remaining[j].Position {
			return remaining[i].ID < remaining[j].ID
		}
		return remaining[i].Position < remaining[j].Position
	})
	for position, item := range remaining {
		item.Position = position
	}
	return nil
}

func (r *mediaRepository) NextPosition(_ context.Context, visitID string) (int, error) {
	return r.NextPositionForOwner(context.Background(), media.VisitOwner(visitID))
}

func (r *mediaRepository) NextPositionForOwner(_ context.Context, owner media.Owner) (int, error) {
	max := -1
	for _, m := range r.media {
		if m.Owner() == owner && m.Position > max {
			max = m.Position
		}
	}
	return max + 1, nil
}

func (r *mediaRepository) Reorder(_ context.Context, visitID string, orderedIDs []string) error {
	return r.ReorderForOwner(context.Background(), media.VisitOwner(visitID), orderedIDs)
}

func (r *mediaRepository) ReorderForOwner(_ context.Context, owner media.Owner, orderedIDs []string) error {
	for pos, id := range orderedIDs {
		if m, ok := r.media[id]; ok && m.Owner() == owner {
			m.Position = pos
		}
	}
	return nil
}

// --- Test setup ---

type testContext struct {
	handler      *media.Handler
	repo         *mediaRepository
	tripChecker  *stubTripChecker
	visitChecker *stubVisitChecker
	legChecker   *stubTravelLegChecker
	storage      *stubStorage
}

func newTestContext() *testContext {
	repo := newMediaRepository()
	tripChecker := newStubTripChecker()
	visitChecker := newStubVisitChecker()
	legChecker := newStubTravelLegChecker()
	storage := newStubStorage()

	visitChecker.visits["visit-1"] = "trip-1"
	visitChecker.visits["visit-2"] = "trip-1"
	legChecker.legs["leg-1"] = "trip-1"
	legChecker.legs["leg-2"] = "trip-1"

	return &testContext{
		handler:      media.NewHandler(repo, storage, tripChecker, visitChecker, legChecker),
		repo:         repo,
		tripChecker:  tripChecker,
		visitChecker: visitChecker,
		legChecker:   legChecker,
		storage:      storage,
	}
}

// --- Tests ---

func TestAdd_Success(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, err := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID:     "visit-1",
		TripID:      "trip-1",
		Filename:    "photo.jpg",
		ContentType: "image/jpeg",
	})

	require.NoError(t, err)
	assert.Equal(t, "visit-1", m.VisitID)
	assert.Equal(t, "trip-1", m.TripID)
	assert.Equal(t, "photo.jpg", m.Filename)
	assert.Equal(t, "image/jpeg", m.ContentType)
	assert.Equal(t, 0, m.Position)
	assert.NotEmpty(t, m.ID)
}

func TestAdd_SecondMediaGetsNextPosition(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})
	require.NoError(t, err)

	m2, err := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "b.mp4", ContentType: "video/mp4",
	})
	require.NoError(t, err)
	assert.Equal(t, 1, m2.Position)
}

func TestAdd_InvalidContentType(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "file.gif", ContentType: "image/gif",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrInvalidContentType)
}

func TestAdd_EmptyFilename(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "", ContentType: "image/jpeg",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrFilenameRequired)
}

func TestAdd_VisitNotFound(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "unknown", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrVisitNotFound)
}

func TestAdd_TripClosed(t *testing.T) {
	tc := newTestContext()
	tc.tripChecker.closedTripIDs["trip-1"] = true
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrTripClosed)
}

func TestUpdateCaption_Success(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	updated, err := tc.handler.UpdateCaption(ctx, media.UpdateCaptionCommand{
		ID: m.ID, Caption: "Sunset over the lake",
	})

	require.NoError(t, err)
	assert.Equal(t, "Sunset over the lake", updated.Caption)
}

func TestUpdateCaption_TripClosed(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	tc.tripChecker.closedTripIDs["trip-1"] = true

	_, err := tc.handler.UpdateCaption(ctx, media.UpdateCaptionCommand{
		ID: m.ID, Caption: "New caption",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrTripClosed)
}

func TestReorder_Success(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m1, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})
	m2, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "b.jpg", ContentType: "image/jpeg",
	})
	m3, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "c.jpg", ContentType: "image/jpeg",
	})

	// Reverse order.
	result, err := tc.handler.Reorder(ctx, media.ReorderCommand{
		VisitID:  "visit-1",
		MediaIDs: []string{m3.ID, m2.ID, m1.ID},
	})

	require.NoError(t, err)
	require.Len(t, result, 3)
	assert.Equal(t, m3.ID, result[0].ID)
	assert.Equal(t, m2.ID, result[1].ID)
	assert.Equal(t, m1.ID, result[2].ID)
}

func TestReorder_IDMismatch(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	_, err := tc.handler.Reorder(ctx, media.ReorderCommand{
		VisitID:  "visit-1",
		MediaIDs: []string{"unknown-id"},
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrIDMismatch)
}

func TestDelete_Success(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	err := tc.handler.Delete(ctx, media.DeleteMediaCommand{ID: m.ID})
	require.NoError(t, err)

	// Verify deleted from repo.
	_, err = tc.handler.GetByID(ctx, media.GetMediaQuery{ID: m.ID})
	assert.ErrorIs(t, err, media.ErrNotFound)

	// Verify storage delete was called.
	assert.True(t, tc.storage.deleted[m.ID])
}

func TestDelete_TripClosed(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	tc.tripChecker.closedTripIDs["trip-1"] = true

	err := tc.handler.Delete(ctx, media.DeleteMediaCommand{ID: m.ID})
	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrTripClosed)
}

func TestMove_VisitToVisit_AppendsAndCompacts(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	first, err := tc.handler.Add(ctx, media.AddMediaCommand{VisitID: "visit-1", TripID: "trip-1", Filename: "first.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)
	second, err := tc.handler.Add(ctx, media.AddMediaCommand{VisitID: "visit-1", TripID: "trip-1", Filename: "second.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)
	destination, err := tc.handler.Add(ctx, media.AddMediaCommand{VisitID: "visit-2", TripID: "trip-1", Filename: "existing.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)

	result, err := tc.handler.Move(ctx, media.MoveMediaCommand{MediaIDs: []string{second.ID}, Owner: media.VisitOwner("visit-2")})
	require.NoError(t, err)
	require.Len(t, result, 2)
	assert.Equal(t, destination.ID, result[0].ID)
	assert.Equal(t, second.ID, result[1].ID)
	assert.Equal(t, 1, result[1].Position)

	remaining, err := tc.repo.FindByID(ctx, first.ID)
	require.NoError(t, err)
	assert.Equal(t, "visit-1", remaining.VisitID)
	assert.Equal(t, 0, remaining.Position)
	moved, err := tc.repo.FindByID(ctx, second.ID)
	require.NoError(t, err)
	assert.Equal(t, "visit-2", moved.VisitID)
	assert.Equal(t, 1, moved.Position)
}

func TestMove_WorksBetweenVisitsAndTravelLegs(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	fromVisit, err := tc.handler.Add(ctx, media.AddMediaCommand{VisitID: "visit-1", TripID: "trip-1", Filename: "visit.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)
	_, err = tc.handler.Move(ctx, media.MoveMediaCommand{MediaIDs: []string{fromVisit.ID}, Owner: media.TravelLegOwner("leg-1")})
	require.NoError(t, err)
	moved, err := tc.repo.FindByID(ctx, fromVisit.ID)
	require.NoError(t, err)
	assert.Equal(t, "leg-1", moved.TravelLegID)
	assert.Empty(t, moved.VisitID)

	fromLeg, err := tc.handler.Add(ctx, media.AddMediaCommand{TravelLegID: "leg-2", TripID: "trip-1", Filename: "leg.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)
	_, err = tc.handler.Move(ctx, media.MoveMediaCommand{MediaIDs: []string{fromLeg.ID}, Owner: media.VisitOwner("visit-2")})
	require.NoError(t, err)
	moved, err = tc.repo.FindByID(ctx, fromLeg.ID)
	require.NoError(t, err)
	assert.Equal(t, "visit-2", moved.VisitID)
	assert.Empty(t, moved.TravelLegID)
}

func TestMove_RejectsInvalidSelectionAndDestination(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()
	item, err := tc.handler.Add(ctx, media.AddMediaCommand{VisitID: "visit-1", TripID: "trip-1", Filename: "photo.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)
	other, err := tc.handler.Add(ctx, media.AddMediaCommand{VisitID: "visit-2", TripID: "trip-1", Filename: "other.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)

	_, err = tc.handler.Move(ctx, media.MoveMediaCommand{MediaIDs: []string{item.ID}, Owner: media.Owner{}})
	assert.ErrorIs(t, err, media.ErrOwnerRequired)

	_, err = tc.handler.Move(ctx, media.MoveMediaCommand{MediaIDs: []string{item.ID, other.ID}, Owner: media.TravelLegOwner("leg-1")})
	assert.ErrorIs(t, err, media.ErrMixedOwners)

	_, err = tc.handler.Move(ctx, media.MoveMediaCommand{MediaIDs: []string{item.ID}, Owner: media.VisitOwner("missing")})
	assert.ErrorIs(t, err, media.ErrVisitNotFound)

	tc.visitChecker.visits["other-trip-visit"] = "trip-2"
	_, err = tc.handler.Move(ctx, media.MoveMediaCommand{MediaIDs: []string{item.ID}, Owner: media.VisitOwner("other-trip-visit")})
	assert.ErrorIs(t, err, media.ErrTripMismatch)
}

func TestMove_RejectsClosedTrip(t *testing.T) {
	tc := newTestContext()
	item, err := tc.handler.Add(context.Background(), media.AddMediaCommand{VisitID: "visit-1", TripID: "trip-1", Filename: "photo.jpg", ContentType: "image/jpeg"})
	require.NoError(t, err)
	tc.tripChecker.closedTripIDs["trip-1"] = true

	_, err = tc.handler.Move(context.Background(), media.MoveMediaCommand{MediaIDs: []string{item.ID}, Owner: media.VisitOwner("visit-2")})
	assert.ErrorIs(t, err, media.ErrTripClosed)
}

func TestListByVisit_SortedByPosition(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})
	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "b.mp4", ContentType: "video/mp4",
	})
	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-2", TripID: "trip-1", Filename: "c.png", ContentType: "image/png",
	})

	result, err := tc.handler.ListByVisit(ctx, media.ListByVisitQuery{VisitID: "visit-1"})
	require.NoError(t, err)
	require.Len(t, result, 2)
	assert.Equal(t, 0, result[0].Position)
	assert.Equal(t, 1, result[1].Position)
}

func TestListByTrip_SortedByVisitThenPosition(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-2", TripID: "trip-1", Filename: "c.png", ContentType: "image/png",
	})
	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})
	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-1", TripID: "trip-1", Filename: "b.mp4", ContentType: "video/mp4",
	})
	tc.handler.Add(ctx, media.AddMediaCommand{
		VisitID: "visit-9", TripID: "trip-2", Filename: "other.jpg", ContentType: "image/jpeg",
	})

	result, err := tc.handler.ListByTrip(ctx, media.ListByTripQuery{TripID: "trip-1"})
	require.NoError(t, err)
	require.Len(t, result, 3)
	assert.Equal(t, "a.jpg", result[0].Filename)
	assert.Equal(t, "b.mp4", result[1].Filename)
	assert.Equal(t, "c.png", result[2].Filename)
}

func TestListByTrip_EmptyTrip(t *testing.T) {
	tc := newTestContext()

	result, err := tc.handler.ListByTrip(context.Background(), media.ListByTripQuery{TripID: "trip-unknown"})
	require.NoError(t, err)
	assert.Empty(t, result)
}

func TestModel_IsPhoto_IsVideo(t *testing.T) {
	photo, _ := media.NewMedia("1", "d", "t", "a.jpg", "image/jpeg", 0)
	video, _ := media.NewMedia("2", "d", "t", "b.mp4", "video/mp4", 0)

	assert.True(t, photo.IsPhoto())
	assert.False(t, photo.IsVideo())
	assert.False(t, video.IsPhoto())
	assert.True(t, video.IsVideo())
}

func TestModel_Ext(t *testing.T) {
	cases := []struct {
		contentType string
		ext         string
	}{
		{"image/jpeg", ".jpg"},
		{"image/png", ".png"},
		{"image/webp", ".webp"},
		{"video/mp4", ".mp4"},
		{"video/quicktime", ".mov"},
		{"video/webm", ".webm"},
	}
	for _, tc := range cases {
		m, _ := media.NewMedia("1", "d", "t", "f", tc.contentType, 0)
		assert.Equal(t, tc.ext, m.Ext(), "content type: %s", tc.contentType)
	}
}
