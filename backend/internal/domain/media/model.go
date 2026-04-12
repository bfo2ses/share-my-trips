package media

import (
	"errors"
	"strings"
	"time"
)

// Domain errors.
var (
	ErrNotFound           = errors.New("media not found")
	ErrFilenameRequired   = errors.New("filename is required")
	ErrInvalidContentType = errors.New("unsupported content type")
	ErrTripClosed         = errors.New("trip is closed and cannot be modified")
	ErrDayNotFound        = errors.New("day not found")
	ErrIDMismatch         = errors.New("media IDs do not match the day's media")
)

// Supported content types.
var allowedContentTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"video/mp4":  true,
	"video/quicktime": true, // .mov
	"video/webm": true,
}

// Media represents a photo or video attached to a trip day.
type Media struct {
	ID          string
	DayID       string
	TripID      string
	Filename    string
	ContentType string
	Caption     string
	Position    int
	CreatedAt   time.Time
}

// NewMedia creates a new Media with validated fields.
func NewMedia(id, dayID, tripID, filename, contentType string, position int) (*Media, error) {
	if strings.TrimSpace(filename) == "" {
		return nil, ErrFilenameRequired
	}
	if !allowedContentTypes[contentType] {
		return nil, ErrInvalidContentType
	}

	return &Media{
		ID:          id,
		DayID:       dayID,
		TripID:      tripID,
		Filename:    filename,
		ContentType: contentType,
		Position:    position,
		CreatedAt:   time.Now(),
	}, nil
}

// UpdateCaption sets a new caption.
func (m *Media) UpdateCaption(caption string) {
	m.Caption = caption
}

// IsPhoto returns true if this media is an image.
func (m *Media) IsPhoto() bool {
	return strings.HasPrefix(m.ContentType, "image/")
}

// IsVideo returns true if this media is a video.
func (m *Media) IsVideo() bool {
	return strings.HasPrefix(m.ContentType, "video/")
}

// Ext returns the file extension derived from the content type.
func (m *Media) Ext() string {
	switch m.ContentType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "video/mp4":
		return ".mp4"
	case "video/quicktime":
		return ".mov"
	case "video/webm":
		return ".webm"
	default:
		return ""
	}
}
