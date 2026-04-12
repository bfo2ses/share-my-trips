package imaging_test

import (
	"image"
	"image/color"
	"image/jpeg"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	adapter "github.com/bfosses/sharemytrips/internal/adapter/imaging"
)

func createTestJPEG(t *testing.T, path string, width, height int) {
	t.Helper()
	os.MkdirAll(filepath.Dir(path), 0755)
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := range height {
		for x := range width {
			img.Set(x, y, color.RGBA{R: 100, G: 150, B: 200, A: 255})
		}
	}
	f, err := os.Create(path)
	require.NoError(t, err)
	defer f.Close()
	require.NoError(t, jpeg.Encode(f, img, nil))
}

func TestGenerateThumb_Photo(t *testing.T) {
	dir := t.TempDir()
	srcPath := filepath.Join(dir, "original.jpg")
	thumbPath := filepath.Join(dir, "thumbs", "thumb.jpg")

	createTestJPEG(t, srcPath, 1600, 1200)

	th := adapter.NewThumbnailer()
	err := th.GenerateThumb(srcPath, thumbPath, false)
	require.NoError(t, err)

	// Verify thumb exists and is 400px wide.
	f, err := os.Open(thumbPath)
	require.NoError(t, err)
	defer f.Close()

	img, _, err := image.Decode(f)
	require.NoError(t, err)

	bounds := img.Bounds()
	assert.Equal(t, 400, bounds.Dx())
	// Height should be proportional: 1200/1600 * 400 = 300.
	assert.Equal(t, 300, bounds.Dy())
}

func TestGenerateThumb_VideoPlaceholder(t *testing.T) {
	dir := t.TempDir()
	thumbPath := filepath.Join(dir, "thumbs", "placeholder.jpg")

	th := adapter.NewThumbnailer()
	err := th.GenerateThumb("", thumbPath, true)
	require.NoError(t, err)

	// Verify placeholder exists and is a valid image.
	f, err := os.Open(thumbPath)
	require.NoError(t, err)
	defer f.Close()

	img, _, err := image.Decode(f)
	require.NoError(t, err)

	bounds := img.Bounds()
	assert.Equal(t, 400, bounds.Dx())
	assert.Equal(t, 300, bounds.Dy())
}
