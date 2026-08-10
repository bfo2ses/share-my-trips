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
	ErrVisitNotFound      = errors.New("visit not found")
	ErrTravelLegNotFound  = errors.New("travel leg not found")
	ErrOwnerRequired      = errors.New("exactly one media owner is required")
	ErrTripMismatch       = errors.New("media owner does not belong to the trip")
	ErrIDMismatch         = errors.New("media IDs do not match the owner's media")
	ErrMediaRequired      = errors.New("at least one media is required")
	ErrMixedOwners        = errors.New("media must belong to the same owner")
	ErrSameOwner          = errors.New("media already belongs to this owner")
)

// Owner is the single entity that owns a media item. The zero value is
// invalid; exactly one identifier must be present.
type Owner struct {
	VisitID     string
	TravelLegID string
}

func VisitOwner(visitID string) Owner         { return Owner{VisitID: visitID} }
func TravelLegOwner(travelLegID string) Owner { return Owner{TravelLegID: travelLegID} }

func (o Owner) Validate() error {
	if (o.VisitID == "") == (o.TravelLegID == "") {
		return ErrOwnerRequired
	}
	return nil
}

func (o Owner) ID() string {
	if o.VisitID != "" {
		return o.VisitID
	}
	return o.TravelLegID
}

func (o Owner) IsVisit() bool { return o.VisitID != "" }

// Supported content types.
var allowedContentTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/webp":      true,
	"video/mp4":       true,
	"video/quicktime": true, // .mov
	"video/webm":      true,
}

// Media represents a photo or video attached to exactly one trip owner.
type Media struct {
	ID          string
	VisitID     string
	TravelLegID string
	TripID      string
	Filename    string
	ContentType string
	Caption     string
	Position    int
	CreatedAt   time.Time
}

// NewMedia creates a new Media with validated fields.
func NewMedia(id, visitID, tripID, filename, contentType string, position int) (*Media, error) {
	return newMedia(id, tripID, VisitOwner(visitID), filename, contentType, position)
}

// NewTravelLegMedia creates media owned by a saved travel leg.
func NewTravelLegMedia(id, travelLegID, tripID, filename, contentType string, position int) (*Media, error) {
	return newMedia(id, tripID, TravelLegOwner(travelLegID), filename, contentType, position)
}

func newMedia(id, tripID string, owner Owner, filename, contentType string, position int) (*Media, error) {
	if strings.TrimSpace(filename) == "" {
		return nil, ErrFilenameRequired
	}
	if !allowedContentTypes[contentType] {
		return nil, ErrInvalidContentType
	}
	if err := owner.Validate(); err != nil {
		return nil, err
	}

	return &Media{
		ID:          id,
		VisitID:     owner.VisitID,
		TravelLegID: owner.TravelLegID,
		TripID:      tripID,
		Filename:    filename,
		ContentType: contentType,
		Position:    position,
		CreatedAt:   time.Now(),
	}, nil
}

// Owner returns the validated owner reference of this media item.
func (m *Media) Owner() Owner { return Owner{VisitID: m.VisitID, TravelLegID: m.TravelLegID} }

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
