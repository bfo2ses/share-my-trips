package mediahttp

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/bfosses/sharemytrips/internal/domain/media"
)

// MediaHandler serves media files and handles uploads.
type MediaHandler struct {
	mediaHandler *media.Handler
	storage      media.Storage
	thumbnailer  media.Thumbnailer
}

// NewMediaHandler creates a new MediaHandler.
func NewMediaHandler(mediaHandler *media.Handler, storage media.Storage, thumbnailer media.Thumbnailer) *MediaHandler {
	return &MediaHandler{
		mediaHandler: mediaHandler,
		storage:      storage,
		thumbnailer:  thumbnailer,
	}
}

// ServeHTTP dispatches /media/ requests.
func (h *MediaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Strip /media/ prefix.
	path := strings.TrimPrefix(r.URL.Path, "/media/")
	if path == "" {
		http.NotFound(w, r)
		return
	}

	parts := strings.SplitN(path, "/", 2)
	id := parts[0]

	if len(parts) == 2 && parts[1] == "thumb" {
		h.serveThumb(w, r, id)
		return
	}

	if len(parts) == 1 {
		h.serveOriginal(w, r, id)
		return
	}

	http.NotFound(w, r)
}

func (h *MediaHandler) serveOriginal(w http.ResponseWriter, r *http.Request, id string) {
	m, err := h.mediaHandler.GetByID(r.Context(), media.GetMediaQuery{ID: id})
	if err != nil {
		http.NotFound(w, r)
		return
	}

	filePath := h.storage.FilePath(m.ID, m.TripID, m.DayID, m.Ext())
	w.Header().Set("Content-Type", m.ContentType)
	http.ServeFile(w, r, filePath)
}

func (h *MediaHandler) serveThumb(w http.ResponseWriter, r *http.Request, id string) {
	m, err := h.mediaHandler.GetByID(r.Context(), media.GetMediaQuery{ID: id})
	if err != nil {
		http.NotFound(w, r)
		return
	}

	thumbPath := h.storage.ThumbPath(m.ID, m.TripID, m.DayID)

	// Generate thumb if it doesn't exist.
	if _, err := os.Stat(thumbPath); os.IsNotExist(err) {
		originalPath := h.storage.FilePath(m.ID, m.TripID, m.DayID, m.Ext())
		if err := h.thumbnailer.GenerateThumb(originalPath, thumbPath, m.IsVideo()); err != nil {
			http.Error(w, "failed to generate thumbnail", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	http.ServeFile(w, r, thumbPath)
}

// UploadHandler handles multipart file uploads.
// POST /api/upload with multipart form: file, dayID, tripID.
type UploadHandler struct {
	mediaHandler *media.Handler
	storage      media.Storage
}

// NewUploadHandler creates a new UploadHandler.
func NewUploadHandler(mediaHandler *media.Handler, storage media.Storage) *UploadHandler {
	return &UploadHandler{
		mediaHandler: mediaHandler,
		storage:      storage,
	}
}

func (h *UploadHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form with 32MB max memory.
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "failed to parse form", http.StatusBadRequest)
		return
	}

	dayID := r.FormValue("dayID")
	tripID := r.FormValue("tripID")
	if dayID == "" || tripID == "" {
		http.Error(w, "dayID and tripID are required", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = detectContentType(header.Filename)
	}

	// Create media entity.
	m, err := h.mediaHandler.Add(r.Context(), media.AddMediaCommand{
		DayID:       dayID,
		TripID:      tripID,
		Filename:    header.Filename,
		ContentType: contentType,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Store file.
	if err := h.storage.Store(m.ID, m.TripID, m.DayID, m.Ext(), file); err != nil {
		http.Error(w, "failed to store file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"id":"%s","url":"/media/%s","thumbUrl":"/media/%s/thumb"}`, m.ID, m.ID, m.ID)
}

func detectContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".mp4":
		return "video/mp4"
	case ".mov":
		return "video/quicktime"
	case ".webm":
		return "video/webm"
	default:
		return "application/octet-stream"
	}
}

// RequireAuth is middleware that requires a valid auth token.
func RequireAuth(tokenResolver func(token string) (string, error), next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := bearerToken(r.Header.Get("Authorization"))
		if token == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		_, err := tokenResolver(token)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func bearerToken(header string) string {
	const prefix = "Bearer "
	if strings.HasPrefix(header, prefix) {
		return strings.TrimPrefix(header, prefix)
	}
	return ""
}

// StreamingUploadHandler handles large file uploads by streaming to disk.
// POST /api/upload/stream with raw body and query params.
// This is a simpler alternative for large files — the frontend sends the file
// as the request body with metadata in query parameters.
type StreamingUploadHandler struct {
	mediaHandler *media.Handler
	storage      media.Storage
}

func NewStreamingUploadHandler(mediaHandler *media.Handler, storage media.Storage) *StreamingUploadHandler {
	return &StreamingUploadHandler{
		mediaHandler: mediaHandler,
		storage:      storage,
	}
}

func (h *StreamingUploadHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dayID := r.URL.Query().Get("dayID")
	tripID := r.URL.Query().Get("tripID")
	filename := r.URL.Query().Get("filename")
	contentType := r.URL.Query().Get("contentType")

	if dayID == "" || tripID == "" || filename == "" || contentType == "" {
		http.Error(w, "dayID, tripID, filename, and contentType query params are required", http.StatusBadRequest)
		return
	}

	// Create media entity.
	m, err := h.mediaHandler.Add(r.Context(), media.AddMediaCommand{
		DayID:       dayID,
		TripID:      tripID,
		Filename:    filename,
		ContentType: contentType,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Stream body directly to storage.
	if err := h.storage.Store(m.ID, m.TripID, m.DayID, m.Ext(), io.LimitReader(r.Body, 2<<30)); err != nil {
		http.Error(w, "failed to store file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"id":"%s","url":"/media/%s","thumbUrl":"/media/%s/thumb"}`, m.ID, m.ID, m.ID)
}
