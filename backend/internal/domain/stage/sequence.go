package stage

import (
	"sort"
	"time"
)

// PrimaryVisit is the information needed to derive the chronological position
// of a stage. Only a visit's primary stage participates in the itinerary.
type PrimaryVisit struct {
	StageID string
	Date    time.Time
}

// ChronologicalSequence projects stages into their itinerary order. Stages with
// a primary visit are ordered by their earliest visit date; remaining ties use
// stage creation time and then ID so the projection is deterministic.
//
// The returned slice is a copy and never changes the repository's order.
func ChronologicalSequence(stages []*Stage, primaryVisits []PrimaryVisit) []*Stage {
	earliestDate := make(map[string]time.Time, len(stages))
	for _, visit := range primaryVisits {
		if visit.StageID == "" || visit.Date.IsZero() {
			continue
		}
		if existing, ok := earliestDate[visit.StageID]; !ok || visit.Date.Before(existing) {
			earliestDate[visit.StageID] = visit.Date
		}
	}

	ordered := append([]*Stage(nil), stages...)
	sort.Slice(ordered, func(i, j int) bool {
		di, hasDateI := earliestDate[ordered[i].ID]
		dj, hasDateJ := earliestDate[ordered[j].ID]
		if hasDateI != hasDateJ {
			return hasDateI
		}
		if hasDateI && !di.Equal(dj) {
			return di.Before(dj)
		}
		if !ordered[i].CreatedAt.Equal(ordered[j].CreatedAt) {
			return ordered[i].CreatedAt.Before(ordered[j].CreatedAt)
		}
		return ordered[i].ID < ordered[j].ID
	})
	return ordered
}
