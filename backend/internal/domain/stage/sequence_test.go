package stage

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestChronologicalSequence_OrdersByEarliestPrimaryVisitThenCreationThenID(t *testing.T) {
	t.Parallel()

	first := time.Date(2025, time.July, 1, 0, 0, 0, 0, time.UTC)
	createdAt := time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC)
	stages := []*Stage{
		{ID: "no-visit", CreatedAt: createdAt.Add(2 * time.Hour)},
		{ID: "same-date-b", CreatedAt: createdAt.Add(time.Hour)},
		{ID: "later", CreatedAt: createdAt},
		{ID: "same-date-a", CreatedAt: createdAt.Add(time.Hour)},
		{ID: "first", CreatedAt: createdAt.Add(3 * time.Hour)},
		{ID: "no-visit-earlier", CreatedAt: createdAt},
	}

	ordered := ChronologicalSequence(stages, []PrimaryVisit{
		{StageID: "later", Date: first.AddDate(0, 0, 2)},
		{StageID: "first", Date: first},
		{StageID: "same-date-a", Date: first.AddDate(0, 0, 1)},
		{StageID: "same-date-b", Date: first.AddDate(0, 0, 1)},
		{StageID: "later", Date: first.AddDate(0, 0, 3)},
	})

	assert.Equal(t, []string{
		"first", "same-date-a", "same-date-b", "later", "no-visit-earlier", "no-visit",
	}, stageIDs(ordered))
	assert.Equal(t, "no-visit", stages[0].ID, "the projection must not mutate repository order")
}

func TestChronologicalSequence_IgnoresVisitsWithoutAPrimaryStageOrDate(t *testing.T) {
	t.Parallel()

	createdAt := time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC)
	stages := []*Stage{
		{ID: "b", CreatedAt: createdAt.Add(time.Hour)},
		{ID: "a", CreatedAt: createdAt},
	}

	ordered := ChronologicalSequence(stages, []PrimaryVisit{
		{StageID: "", Date: createdAt.AddDate(1, 0, 0)},
		{StageID: "b"},
	})

	assert.Equal(t, []string{"a", "b"}, stageIDs(ordered))
}

func TestChronologicalSequence_ReordersReverseRepositoryOrderUsingEarliestPrimaryDate(t *testing.T) {
	t.Parallel()

	createdAt := time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC)
	stages := []*Stage{
		{ID: "later-in-repository", CreatedAt: createdAt},
		{ID: "earlier-in-repository", CreatedAt: createdAt.Add(time.Hour)},
	}

	ordered := ChronologicalSequence(stages, []PrimaryVisit{
		{StageID: "later-in-repository", Date: time.Date(2025, time.June, 2, 0, 0, 0, 0, time.UTC)},
		{StageID: "earlier-in-repository", Date: time.Date(2025, time.June, 1, 0, 0, 0, 0, time.UTC)},
	})

	assert.Equal(t, []string{"earlier-in-repository", "later-in-repository"}, stageIDs(ordered))
}

func stageIDs(stages []*Stage) []string {
	ids := make([]string, 0, len(stages))
	for _, stage := range stages {
		ids = append(ids, stage.ID)
	}
	return ids
}
