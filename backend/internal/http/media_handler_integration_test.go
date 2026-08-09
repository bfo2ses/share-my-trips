package mediahttp

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"image"
	"image/color"
	"image/jpeg"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bfosses/sharemytrips/internal/adapter/filesystem"
	imaging "github.com/bfosses/sharemytrips/internal/adapter/imaging"
	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

const (
	testTripID  = "trip-1"
	testVisitID = "visit-1"
	testToken   = "valid-session"
)

type mediaHTTPHarness struct {
	server  *httptest.Server
	client  *http.Client
	storage *filesystem.Storage
	media   *media.Handler
}

func newMediaHTTPHarness(t *testing.T) *mediaHTTPHarness {
	t.Helper()

	tripRepo := memory.NewTripRepository()
	visitRepo := memory.NewVisitRepository()
	storage := filesystem.NewStorage(t.TempDir())
	mediaHandler := media.NewHandler(
		memory.NewMediaRepository(),
		storage,
		memory.NewTripChecker(tripRepo),
		memory.NewVisitChecker(visitRepo),
	)

	seedMediaHTTPTripAndVisit(t, tripRepo, visitRepo)

	mux := http.NewServeMux()
	mux.Handle("/api/upload", RequireEditor(resolveTestUser, NewUploadHandler(mediaHandler, storage)))
	mux.Handle("/media/", NewMediaHandler(mediaHandler, storage, imaging.NewThumbnailer()))

	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	return &mediaHTTPHarness{server: server, client: server.Client(), storage: storage, media: mediaHandler}
}

func resolveTestUser(_ context.Context, token string) (*auth.User, error) {
	if token != testToken {
		return nil, errors.New("unknown session")
	}
	return &auth.User{ID: "admin-1", Role: auth.RoleAdmin}, nil
}

func seedMediaHTTPTripAndVisit(t *testing.T, tripRepo *memory.TripRepository, visitRepo *memory.VisitRepository) {
	t.Helper()

	tripItem, err := trip.NewTrip(testTripID, "Japan", "Japan", "", "", 35.6762, 139.6503, time.Time{}, time.Time{})
	require.NoError(t, err)
	require.NoError(t, tripRepo.Save(context.Background(), tripItem))

	v, err := visit.NewVisit(testVisitID, testTripID, "stage-1", time.Date(2027, time.April, 1, 0, 0, 0, 0, time.UTC), "Tokyo", "", 35.6762, 139.6503, 0)
	require.NoError(t, err)
	require.NoError(t, visitRepo.Save(context.Background(), v))
}

func uploadMediaRequest(t *testing.T, harness *mediaHTTPHarness, token string, filename, contentType string, contents []byte) *http.Response {
	t.Helper()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	require.NoError(t, writer.WriteField("tripID", testTripID))
	require.NoError(t, writer.WriteField("visitID", testVisitID))

	fileHeader := textproto.MIMEHeader{}
	fileHeader.Set("Content-Disposition", `form-data; name="file"; filename="`+filename+`"`)
	fileHeader.Set("Content-Type", contentType)
	part, err := writer.CreatePart(fileHeader)
	require.NoError(t, err)
	_, err = part.Write(contents)
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	req, err := http.NewRequestWithContext(t.Context(), http.MethodPost, harness.server.URL+"/api/upload", &body)
	require.NoError(t, err)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := harness.client.Do(req)
	require.NoError(t, err)
	return resp
}

func TestUploadHandler_RejectsMissingOrInvalidToken(t *testing.T) {
	for _, tc := range []struct {
		name  string
		token string
	}{
		{name: "missing token"},
		{name: "invalid token", token: "unknown-session"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			harness := newMediaHTTPHarness(t)
			resp := uploadMediaRequest(t, harness, tc.token, "tokyo.jpg", "image/jpeg", []byte("image bytes"))
			defer resp.Body.Close()

			assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
			mediaList, err := harness.media.ListByVisit(t.Context(), media.ListByVisitQuery{VisitID: testVisitID})
			require.NoError(t, err)
			assert.Empty(t, mediaList)
		})
	}
}

func TestMediaHTTP_UploadStoresAndServesOriginal(t *testing.T) {
	harness := newMediaHTTPHarness(t)
	contents := validJPEG(t)

	resp := uploadMediaRequest(t, harness, testToken, "tokyo.jpg", "image/jpeg", contents)
	defer resp.Body.Close()
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	require.Equal(t, "application/json", resp.Header.Get("Content-Type"))

	var uploaded struct {
		ID       string `json:"id"`
		URL      string `json:"url"`
		ThumbURL string `json:"thumbUrl"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&uploaded))
	assert.NotEmpty(t, uploaded.ID)
	assert.Equal(t, "/media/"+uploaded.ID, uploaded.URL)
	assert.Equal(t, "/media/"+uploaded.ID+"/thumb", uploaded.ThumbURL)

	stored, err := harness.media.GetByID(t.Context(), media.GetMediaQuery{ID: uploaded.ID})
	require.NoError(t, err)
	assert.Equal(t, "tokyo.jpg", stored.Filename)
	assert.Equal(t, "image/jpeg", stored.ContentType)

	storedBytes, err := os.ReadFile(harness.storage.FilePath(stored.ID, stored.TripID, stored.Owner(), stored.Ext()))
	require.NoError(t, err)
	assert.Equal(t, contents, storedBytes)

	getReq, err := http.NewRequestWithContext(t.Context(), http.MethodGet, harness.server.URL+uploaded.URL, nil)
	require.NoError(t, err)
	getResp, err := harness.client.Do(getReq)
	require.NoError(t, err)
	defer getResp.Body.Close()
	assert.Equal(t, http.StatusOK, getResp.StatusCode)
	assert.Equal(t, "image/jpeg", getResp.Header.Get("Content-Type"))
	servedBytes, err := io.ReadAll(getResp.Body)
	require.NoError(t, err)
	assert.Equal(t, contents, servedBytes)

	thumbReq, err := http.NewRequestWithContext(t.Context(), http.MethodGet, harness.server.URL+uploaded.ThumbURL, nil)
	require.NoError(t, err)
	thumbResp, err := harness.client.Do(thumbReq)
	require.NoError(t, err)
	defer thumbResp.Body.Close()
	assert.Equal(t, http.StatusOK, thumbResp.StatusCode)
	assert.Equal(t, "image/jpeg", thumbResp.Header.Get("Content-Type"))
	assert.Equal(t, "public, max-age=31536000, immutable", thumbResp.Header.Get("Cache-Control"))

	require.NoError(t, harness.media.Delete(t.Context(), media.DeleteMediaCommand{ID: uploaded.ID}))
	_, err = harness.media.GetByID(t.Context(), media.GetMediaQuery{ID: uploaded.ID})
	require.ErrorIs(t, err, media.ErrNotFound)
	_, err = os.Stat(harness.storage.FilePath(stored.ID, stored.TripID, stored.Owner(), stored.Ext()))
	assert.ErrorIs(t, err, os.ErrNotExist)
}

func validJPEG(t *testing.T) []byte {
	t.Helper()

	var buffer bytes.Buffer
	image := image.NewRGBA(image.Rect(0, 0, 1, 1))
	image.Set(0, 0, color.RGBA{R: 198, G: 163, B: 93, A: 255})
	require.NoError(t, jpeg.Encode(&buffer, image, nil))
	return buffer.Bytes()
}
