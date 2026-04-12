package media

// Thumbnailer is the port for generating thumbnail images.
type Thumbnailer interface {
	// GenerateThumb creates a thumbnail from originalPath and writes it to thumbPath.
	// For photos, this resizes the image. For videos, this generates a placeholder.
	GenerateThumb(originalPath, thumbPath string, isVideo bool) error
}
