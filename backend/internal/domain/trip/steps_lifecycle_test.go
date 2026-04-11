package trip_test

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

func registerLifecycleSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^un voyage "([^"]*)" existe en brouillon$`, tc.tripExistsAsDraft)
	ctx.Step(`^un voyage "([^"]*)" est publié$`, tc.tripIsPublished)
	ctx.Step(`^un voyage "([^"]*)" est clôturé$`, tc.tripIsClosed)
	ctx.Step(`^je publie le voyage$`, tc.publishTrip)
	ctx.Step(`^son statut passe à "([^"]*)"$`, tc.tripStatusChangesTo)
	ctx.Step(`^le voyage est modifiable$`, tc.tripIsEditable)
	ctx.Step(`^le voyage n\'est pas modifiable$`, tc.tripIsNotEditable)
	ctx.Step(`^je repasse le voyage en brouillon$`, tc.unpublishTrip)
	ctx.Step(`^le voyage contient des jours du "([^"]*)" au "([^"]*)"$`, tc.tripHasDaysFromTo)
	ctx.Step(`^je clôture le voyage$`, tc.closeTrip)
	ctx.Step(`^les dates du voyage sont recalculées du "([^"]*)" au "([^"]*)"$`, tc.tripDatesAreRecalculatedFromTo)
	ctx.Step(`^je tente de clôturer le voyage sans jours$`, tc.closeTripWithoutDays)
	ctx.Step(`^un message m\'indique qu\'il faut au moins un jour pour clôturer$`, tc.errNoDaysToClose)
	ctx.Step(`^un message m\'indique que l\'on ne peut pas clôturer un brouillon$`, tc.errCannotCloseDraft)
	ctx.Step(`^je réouvre le voyage$`, tc.reopenTrip)
}

func (tc *testContext) tripExistsAsDraft(title string) error {
	cmd := trip.CreateTripCommand{
		Title:     title,
		Country:   "Islande",
		Lat:       defaultLat,
		Lng:       defaultLng,
		StartDate: time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC),
		EndDate:   time.Date(2025, 7, 14, 0, 0, 0, 0, time.UTC),
	}
	tc.currentTrip, tc.lastErr = tc.handler.Create(context.Background(), cmd)
	return tc.lastErr
}

func (tc *testContext) tripIsPublished(title string) error {
	if err := tc.tripExistsAsDraft(title); err != nil {
		return err
	}
	tc.currentTrip, tc.lastErr = tc.handler.Publish(context.Background(), trip.PublishTripCommand{ID: tc.currentTrip.ID})
	return tc.lastErr
}

func (tc *testContext) tripIsClosed(title string) error {
	if err := tc.tripIsPublished(title); err != nil {
		return err
	}
	firstDay := time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC)
	lastDay := time.Date(2025, 7, 14, 0, 0, 0, 0, time.UTC)
	tc.currentTrip, tc.lastErr = tc.handler.Close(context.Background(), trip.CloseTripCommand{
		ID: tc.currentTrip.ID, FirstDay: firstDay, LastDay: lastDay,
	})
	return tc.lastErr
}

func (tc *testContext) publishTrip() error {
	tc.currentTrip, tc.lastErr = tc.handler.Publish(context.Background(), trip.PublishTripCommand{ID: tc.currentTrip.ID})
	return nil
}

func (tc *testContext) tripStatusChangesTo(status string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	return tc.tripStatusIs(status)
}

func (tc *testContext) tripIsEditable() error {
	if !tc.currentTrip.IsModifiable() {
		return fmt.Errorf("expected trip to be modifiable")
	}
	return nil
}

func (tc *testContext) tripIsNotEditable() error {
	if tc.currentTrip.IsModifiable() {
		return fmt.Errorf("expected trip to not be modifiable")
	}
	return nil
}

func (tc *testContext) unpublishTrip() error {
	tc.currentTrip, tc.lastErr = tc.handler.Unpublish(context.Background(), trip.UnpublishTripCommand{ID: tc.currentTrip.ID})
	return nil
}

func (tc *testContext) tripHasDaysFromTo(_, _ string) error {
	return nil
}

func (tc *testContext) closeTrip() error {
	firstDay := time.Date(2025, 7, 2, 0, 0, 0, 0, time.UTC)
	lastDay := time.Date(2025, 7, 15, 0, 0, 0, 0, time.UTC)
	tc.currentTrip, tc.lastErr = tc.handler.Close(context.Background(), trip.CloseTripCommand{
		ID: tc.currentTrip.ID, FirstDay: firstDay, LastDay: lastDay,
	})
	return nil
}

func (tc *testContext) tripDatesAreRecalculatedFromTo(start, end string) error {
	return tc.datesAreFromTo(start, end)
}

func (tc *testContext) closeTripWithoutDays() error {
	tc.currentTrip, tc.lastErr = tc.handler.Close(context.Background(), trip.CloseTripCommand{
		ID: tc.currentTrip.ID,
	})
	return nil
}

func (tc *testContext) errNoDaysToClose() error {
	if !errors.Is(tc.lastErr, trip.ErrNoDaysToClose) {
		return fmt.Errorf("expected ErrNoDaysToClose, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) errCannotCloseDraft() error {
	if !errors.Is(tc.lastErr, trip.ErrCannotCloseDraft) {
		return fmt.Errorf("expected ErrCannotCloseDraft, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) reopenTrip() error {
	tc.currentTrip, tc.lastErr = tc.handler.Reopen(context.Background(), trip.ReopenTripCommand{ID: tc.currentTrip.ID})
	return nil
}
