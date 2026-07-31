package media

import "io"

// Storage is the port for file storage on the NAS filesystem.
type Storage interface {
	// Store writes the media file to the storage backend.
	Store(id, tripID, visitID, ext string, reader io.Reader) error
	// Delete removes the original file and its thumbnail from storage.
	Delete(id, tripID, visitID, ext string) error
	// FilePath returns the absolute path to the original file.
	FilePath(id, tripID, visitID, ext string) string
	// ThumbPath returns the absolute path to the thumbnail file.
	ThumbPath(id, tripID, visitID string) string
}
