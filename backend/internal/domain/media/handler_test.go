package media_test

import (
	"context"
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

type stubDayChecker struct {
	days map[string]string // dayID -> tripID
}

func newStubDayChecker() *stubDayChecker {
	return &stubDayChecker{days: make(map[string]string)}
}

func (s *stubDayChecker) Exists(_ context.Context, dayID string) (bool, error) {
	_, ok := s.days[dayID]
	return ok, nil
}

func (s *stubDayChecker) TripID(_ context.Context, dayID string) (string, error) {
	tid, ok := s.days[dayID]
	if !ok {
		return "", media.ErrDayNotFound
	}
	return tid, nil
}

type stubStorage struct {
	deleted map[string]bool
}

func newStubStorage() *stubStorage {
	return &stubStorage{deleted: make(map[string]bool)}
}

func (s *stubStorage) Store(id, tripID, dayID, ext string, _ io.Reader) error { return nil }
func (s *stubStorage) Delete(id, tripID, dayID, ext string) error {
	s.deleted[id] = true
	return nil
}
func (s *stubStorage) FilePath(id, tripID, dayID, ext string) string { return "" }
func (s *stubStorage) ThumbPath(id, tripID, dayID string) string     { return "" }

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

func (r *mediaRepository) ListByDay(_ context.Context, dayID string) ([]*media.Media, error) {
	var result []*media.Media
	for _, m := range r.media {
		if m.DayID == dayID {
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

func (r *mediaRepository) NextPosition(_ context.Context, dayID string) (int, error) {
	max := -1
	for _, m := range r.media {
		if m.DayID == dayID && m.Position > max {
			max = m.Position
		}
	}
	return max + 1, nil
}

func (r *mediaRepository) Reorder(_ context.Context, dayID string, orderedIDs []string) error {
	for pos, id := range orderedIDs {
		if m, ok := r.media[id]; ok && m.DayID == dayID {
			m.Position = pos
		}
	}
	return nil
}

// --- Test setup ---

type testContext struct {
	handler     *media.Handler
	repo        *mediaRepository
	tripChecker *stubTripChecker
	dayChecker  *stubDayChecker
	storage     *stubStorage
}

func newTestContext() *testContext {
	repo := newMediaRepository()
	tripChecker := newStubTripChecker()
	dayChecker := newStubDayChecker()
	storage := newStubStorage()

	dayChecker.days["day-1"] = "trip-1"
	dayChecker.days["day-2"] = "trip-1"

	return &testContext{
		handler:     media.NewHandler(repo, storage, tripChecker, dayChecker),
		repo:        repo,
		tripChecker: tripChecker,
		dayChecker:  dayChecker,
		storage:     storage,
	}
}

// --- Tests ---

func TestAdd_Success(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, err := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID:       "day-1",
		TripID:      "trip-1",
		Filename:    "photo.jpg",
		ContentType: "image/jpeg",
	})

	require.NoError(t, err)
	assert.Equal(t, "day-1", m.DayID)
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
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})
	require.NoError(t, err)

	m2, err := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "b.mp4", ContentType: "video/mp4",
	})
	require.NoError(t, err)
	assert.Equal(t, 1, m2.Position)
}

func TestAdd_InvalidContentType(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "file.gif", ContentType: "image/gif",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrInvalidContentType)
}

func TestAdd_EmptyFilename(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "", ContentType: "image/jpeg",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrFilenameRequired)
}

func TestAdd_DayNotFound(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "unknown", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrDayNotFound)
}

func TestAdd_TripClosed(t *testing.T) {
	tc := newTestContext()
	tc.tripChecker.closedTripIDs["trip-1"] = true
	ctx := context.Background()

	_, err := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrTripClosed)
}

func TestUpdateCaption_Success(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
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
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
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
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})
	m2, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "b.jpg", ContentType: "image/jpeg",
	})
	m3, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "c.jpg", ContentType: "image/jpeg",
	})

	// Reverse order.
	result, err := tc.handler.Reorder(ctx, media.ReorderCommand{
		DayID:    "day-1",
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
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	_, err := tc.handler.Reorder(ctx, media.ReorderCommand{
		DayID:    "day-1",
		MediaIDs: []string{"unknown-id"},
	})

	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrIDMismatch)
}

func TestDelete_Success(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	m, _ := tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
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
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})

	tc.tripChecker.closedTripIDs["trip-1"] = true

	err := tc.handler.Delete(ctx, media.DeleteMediaCommand{ID: m.ID})
	require.Error(t, err)
	assert.ErrorIs(t, err, media.ErrTripClosed)
}

func TestListByDay_SortedByPosition(t *testing.T) {
	tc := newTestContext()
	ctx := context.Background()

	tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "a.jpg", ContentType: "image/jpeg",
	})
	tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-1", TripID: "trip-1", Filename: "b.mp4", ContentType: "video/mp4",
	})
	tc.handler.Add(ctx, media.AddMediaCommand{
		DayID: "day-2", TripID: "trip-1", Filename: "c.png", ContentType: "image/png",
	})

	result, err := tc.handler.ListByDay(ctx, media.ListByDayQuery{DayID: "day-1"})
	require.NoError(t, err)
	require.Len(t, result, 2)
	assert.Equal(t, 0, result[0].Position)
	assert.Equal(t, 1, result[1].Position)
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
