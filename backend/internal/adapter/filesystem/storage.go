package filesystem

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// Storage implements media.Storage using the local filesystem (NAS).
// Directory structure: <basePath>/trips/<tripID>/visits/<visitID>/<mediaID>.<ext>
// Thumbnails:          <basePath>/trips/<tripID>/visits/<visitID>/thumbs/<mediaID>.jpg
type Storage struct {
	basePath string
}

// NewStorage creates a filesystem storage with the given base directory.
func NewStorage(basePath string) *Storage {
	return &Storage{basePath: basePath}
}

func (s *Storage) Store(id, tripID, visitID, ext string, reader io.Reader) error {
	dir := s.visitDir(tripID, visitID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("create media dir: %w", err)
	}

	path := filepath.Join(dir, id+ext)
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create media file: %w", err)
	}
	defer f.Close()

	if _, err := io.Copy(f, reader); err != nil {
		os.Remove(path)
		return fmt.Errorf("write media file: %w", err)
	}

	return nil
}

func (s *Storage) Delete(id, tripID, visitID, ext string) error {
	// Remove original.
	original := filepath.Join(s.visitDir(tripID, visitID), id+ext)
	os.Remove(original) // Ignore error if file doesn't exist.

	// Remove thumbnail.
	thumb := s.ThumbPath(id, tripID, visitID)
	os.Remove(thumb)

	return nil
}

func (s *Storage) FilePath(id, tripID, visitID, ext string) string {
	return filepath.Join(s.visitDir(tripID, visitID), id+ext)
}

func (s *Storage) ThumbPath(id, tripID, visitID string) string {
	return filepath.Join(s.visitDir(tripID, visitID), "thumbs", id+".jpg")
}

func (s *Storage) visitDir(tripID, visitID string) string {
	return filepath.Join(s.basePath, "trips", tripID, "visits", visitID)
}
