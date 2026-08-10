package filesystem

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/bfosses/sharemytrips/internal/domain/media"
)

// Storage implements media.Storage using the local filesystem (NAS).
// Directory structure: <basePath>/trips/<tripID>/{visits|travel-legs}/<ownerID>/<mediaID>.<ext>
// Thumbnails are stored in the same owner directory's thumbs subdirectory.
type Storage struct {
	basePath string
}

// NewStorage creates a filesystem storage with the given base directory.
func NewStorage(basePath string) *Storage {
	return &Storage{basePath: basePath}
}

func (s *Storage) Store(id, tripID string, owner media.Owner, ext string, reader io.Reader) error {
	dir, err := s.ownerDir(tripID, owner)
	if err != nil {
		return err
	}
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

func (s *Storage) Delete(id, tripID string, owner media.Owner, ext string) error {
	dir, err := s.ownerDir(tripID, owner)
	if err != nil {
		return err
	}
	// Remove original.
	original := filepath.Join(dir, id+ext)
	os.Remove(original) // Ignore error if file doesn't exist.

	// Remove thumbnail.
	thumb := filepath.Join(dir, "thumbs", id+".jpg")
	os.Remove(thumb)

	return nil
}

func (s *Storage) Move(id, tripID string, from, to media.Owner, ext string) error {
	fromDir, err := s.ownerDir(tripID, from)
	if err != nil {
		return err
	}
	toDir, err := s.ownerDir(tripID, to)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(toDir, 0755); err != nil {
		return fmt.Errorf("create destination media dir: %w", err)
	}

	if err := os.Rename(filepath.Join(fromDir, id+ext), filepath.Join(toDir, id+ext)); err != nil {
		return fmt.Errorf("move media file: %w", err)
	}
	originalFrom := filepath.Join(fromDir, id+ext)
	originalTo := filepath.Join(toDir, id+ext)
	restoreOriginal := func() {
		_ = os.Rename(originalTo, originalFrom)
	}

	fromThumb := filepath.Join(fromDir, "thumbs", id+".jpg")
	toThumb := filepath.Join(toDir, "thumbs", id+".jpg")
	if _, err := os.Stat(fromThumb); err == nil {
		if err := os.MkdirAll(filepath.Dir(toThumb), 0755); err != nil {
			restoreOriginal()
			return fmt.Errorf("create destination thumbnail dir: %w", err)
		}
		if err := os.Rename(fromThumb, toThumb); err != nil {
			// Restore the original so callers can retry the operation.
			restoreOriginal()
			return fmt.Errorf("move media thumbnail: %w", err)
		}
	} else if !os.IsNotExist(err) {
		restoreOriginal()
		return fmt.Errorf("check media thumbnail: %w", err)
	}

	return nil
}

func (s *Storage) FilePath(id, tripID string, owner media.Owner, ext string) string {
	dir, err := s.ownerDir(tripID, owner)
	if err != nil {
		return ""
	}
	return filepath.Join(dir, id+ext)
}

func (s *Storage) ThumbPath(id, tripID string, owner media.Owner) string {
	dir, err := s.ownerDir(tripID, owner)
	if err != nil {
		return ""
	}
	return filepath.Join(dir, "thumbs", id+".jpg")
}

func (s *Storage) ownerDir(tripID string, owner media.Owner) (string, error) {
	if err := owner.Validate(); err != nil {
		return "", err
	}
	directory := "travel-legs"
	if owner.IsVisit() {
		directory = "visits"
	}
	return filepath.Join(s.basePath, "trips", tripID, directory, owner.ID()), nil
}
