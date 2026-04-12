package imaging

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"os"
	"path/filepath"

	"github.com/disintegration/imaging"
)

const (
	thumbWidth   = 400
	thumbQuality = 80
)

// Thumbnailer generates thumbnails for photos and placeholders for videos.
type Thumbnailer struct{}

// NewThumbnailer creates a new Thumbnailer.
func NewThumbnailer() *Thumbnailer {
	return &Thumbnailer{}
}

// GenerateThumb creates a thumbnail from originalPath and writes it to thumbPath.
func (t *Thumbnailer) GenerateThumb(originalPath, thumbPath string, isVideo bool) error {
	if err := os.MkdirAll(filepath.Dir(thumbPath), 0755); err != nil {
		return fmt.Errorf("create thumb dir: %w", err)
	}

	if isVideo {
		return t.generateVideoPlaceholder(thumbPath)
	}

	return t.generatePhotoThumb(originalPath, thumbPath)
}

func (t *Thumbnailer) generatePhotoThumb(originalPath, thumbPath string) error {
	src, err := imaging.Open(originalPath, imaging.AutoOrientation(true))
	if err != nil {
		return fmt.Errorf("open image: %w", err)
	}

	thumb := imaging.Resize(src, thumbWidth, 0, imaging.Lanczos)

	f, err := os.Create(thumbPath)
	if err != nil {
		return fmt.Errorf("create thumb file: %w", err)
	}
	defer f.Close()

	if err := jpeg.Encode(f, thumb, &jpeg.Options{Quality: thumbQuality}); err != nil {
		os.Remove(thumbPath)
		return fmt.Errorf("encode thumb: %w", err)
	}

	return nil
}

// generateVideoPlaceholder creates a simple dark image with a play triangle.
func (t *Thumbnailer) generateVideoPlaceholder(thumbPath string) error {
	width, height := 400, 300
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Dark background.
	bg := color.RGBA{R: 24, G: 22, B: 18, A: 255}
	draw.Draw(img, img.Bounds(), &image.Uniform{bg}, image.Point{}, draw.Src)

	// Draw a play triangle (simple filled triangle).
	gold := color.RGBA{R: 198, G: 163, B: 93, A: 200}
	cx, cy := width/2, height/2
	size := 30
	for y := cy - size; y <= cy+size; y++ {
		// Triangle width at this y: proportional to distance from center.
		dy := y - cy
		if dy < -size || dy > size {
			continue
		}
		halfW := (size - abs(dy)) * size / (size * 2)
		for x := cx - halfW/3; x <= cx+halfW; x++ {
			img.Set(x, y, gold)
		}
	}

	f, err := os.Create(thumbPath)
	if err != nil {
		return fmt.Errorf("create placeholder: %w", err)
	}
	defer f.Close()

	if err := jpeg.Encode(f, img, &jpeg.Options{Quality: thumbQuality}); err != nil {
		os.Remove(thumbPath)
		return fmt.Errorf("encode placeholder: %w", err)
	}

	return nil
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
