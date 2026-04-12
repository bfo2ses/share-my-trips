package filesystem_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bfosses/sharemytrips/internal/adapter/filesystem"
)

func TestStore_CreatesFileAtExpectedPath(t *testing.T) {
	base := t.TempDir()
	s := filesystem.NewStorage(base)

	err := s.Store("media-1", "trip-1", "day-1", ".jpg", strings.NewReader("fake image"))
	require.NoError(t, err)

	expected := filepath.Join(base, "trips", "trip-1", "days", "day-1", "media-1.jpg")
	_, err = os.Stat(expected)
	assert.NoError(t, err)
}

func TestFilePath_ReturnsCorrectPath(t *testing.T) {
	s := filesystem.NewStorage("/data/media")

	path := s.FilePath("m1", "t1", "d1", ".png")
	assert.Equal(t, "/data/media/trips/t1/days/d1/m1.png", path)
}

func TestThumbPath_ReturnsCorrectPath(t *testing.T) {
	s := filesystem.NewStorage("/data/media")

	path := s.ThumbPath("m1", "t1", "d1")
	assert.Equal(t, "/data/media/trips/t1/days/d1/thumbs/m1.jpg", path)
}

func TestDelete_RemovesFiles(t *testing.T) {
	base := t.TempDir()
	s := filesystem.NewStorage(base)

	// Create original.
	err := s.Store("m1", "t1", "d1", ".jpg", strings.NewReader("data"))
	require.NoError(t, err)

	// Create thumb dir and file.
	thumbDir := filepath.Join(base, "trips", "t1", "days", "d1", "thumbs")
	os.MkdirAll(thumbDir, 0755)
	os.WriteFile(filepath.Join(thumbDir, "m1.jpg"), []byte("thumb"), 0644)

	// Delete.
	err = s.Delete("m1", "t1", "d1", ".jpg")
	require.NoError(t, err)

	// Both files should be gone.
	_, err = os.Stat(s.FilePath("m1", "t1", "d1", ".jpg"))
	assert.True(t, os.IsNotExist(err))

	_, err = os.Stat(s.ThumbPath("m1", "t1", "d1"))
	assert.True(t, os.IsNotExist(err))
}
