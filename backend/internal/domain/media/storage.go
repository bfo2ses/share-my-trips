package media

import "io"

// Storage is the port for file storage on the NAS filesystem.
type Storage interface {
	// Store writes the media file to the storage backend.
	Store(id, tripID string, owner Owner, ext string, reader io.Reader) error
	// Delete removes the original file and its thumbnail from storage.
	Delete(id, tripID string, owner Owner, ext string) error
	// Move renames the original and thumbnail from one owner directory to another.
	Move(id, tripID string, from, to Owner, ext string) error
	// FilePath returns the absolute path to the original file.
	FilePath(id, tripID string, owner Owner, ext string) string
	// ThumbPath returns the absolute path to the thumbnail file.
	ThumbPath(id, tripID string, owner Owner) string
}
