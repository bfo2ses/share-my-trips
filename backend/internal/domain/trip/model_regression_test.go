package trip_test

import (
	"errors"
	"testing"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

func TestPublishedTripCannotLoseStartDateOnUpdate(t *testing.T) {
	startDate := time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC)
	current, err := trip.NewTrip("trip-1", "Voyage test", "France", "", "", 44.8, -0.5, startDate, time.Time{})
	if err != nil {
		t.Fatalf("create trip: %v", err)
	}
	if err := current.Publish(); err != nil {
		t.Fatalf("publish trip: %v", err)
	}

	err = current.Update("Voyage modifié", "France", "", "", 45, -1, time.Time{}, time.Time{})

	if !errors.Is(err, trip.ErrStartDateRequired) {
		t.Fatalf("expected ErrStartDateRequired, got %v", err)
	}
	if !current.StartDate.Equal(startDate) {
		t.Fatalf("expected start date to remain %s, got %s", startDate, current.StartDate)
	}
}
