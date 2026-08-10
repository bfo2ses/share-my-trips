package postgres_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	postgrescontainer "github.com/testcontainers/testcontainers-go/modules/postgres"

	postgresadapter "github.com/bfosses/sharemytrips/internal/adapter/postgres"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	"github.com/bfosses/sharemytrips/migrations"
)

func TestTripRepository_PersistsTripAfterMigrations(t *testing.T) {
	ctx := t.Context()
	container, err := postgrescontainer.Run(ctx, "postgres:17-alpine",
		postgrescontainer.WithDatabase("sharemytrips"),
		postgrescontainer.WithUsername("smt"),
		postgrescontainer.WithPassword("test-password"),
		postgrescontainer.BasicWaitStrategies(),
	)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, testcontainers.TerminateContainer(container)) })

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)
	require.NoError(t, postgresadapter.RunMigrations(dsn, migrations.FS))

	pool, err := postgresadapter.NewPool(ctx, dsn)
	require.NoError(t, err)
	t.Cleanup(pool.Close)

	repository := postgresadapter.NewTripRepository(pool)
	startDate := time.Date(2027, time.April, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2027, time.April, 15, 0, 0, 0, 0, time.UTC)
	tripItem, err := trip.NewTrip("trip-1", "Japan 2027", "Japan", "Tokyo and Kyoto", "japan.jpg", 35.6762, 139.6503, startDate, endDate)
	require.NoError(t, err)
	require.NoError(t, repository.Save(ctx, tripItem))

	persisted, err := repository.FindByID(ctx, tripItem.ID)
	require.NoError(t, err)
	assert.Equal(t, tripItem.ID, persisted.ID)
	assert.Equal(t, tripItem.Title, persisted.Title)
	assert.Equal(t, tripItem.Country, persisted.Country)
	assert.Equal(t, tripItem.Description, persisted.Description)
	assert.Equal(t, tripItem.CoverPhoto, persisted.CoverPhoto)
	assert.Equal(t, tripItem.StartDate, persisted.StartDate)
	assert.Equal(t, tripItem.EndDate, persisted.EndDate)
	assert.Equal(t, trip.StatusDraft, persisted.Status)
}

func TestTravelLegRepository_PersistsBusAfterMigrations(t *testing.T) {
	ctx := t.Context()
	container, err := postgrescontainer.Run(ctx, "postgres:17-alpine",
		postgrescontainer.WithDatabase("sharemytrips"),
		postgrescontainer.WithUsername("smt"),
		postgrescontainer.WithPassword("test-password"),
		postgrescontainer.BasicWaitStrategies(),
	)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, testcontainers.TerminateContainer(container)) })

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)
	require.NoError(t, postgresadapter.RunMigrations(dsn, migrations.FS))

	pool, err := postgresadapter.NewPool(ctx, dsn)
	require.NoError(t, err)
	t.Cleanup(pool.Close)

	tripRepository := postgresadapter.NewTripRepository(pool)
	tripItem, err := trip.NewTrip("trip-bus", "France 2027", "France", "", "", 48.8566, 2.3522, time.Time{}, time.Time{})
	require.NoError(t, err)
	require.NoError(t, tripRepository.Save(ctx, tripItem))

	stageRepository := postgresadapter.NewStageRepository(pool)
	fromStage, err := stage.NewStage("stage-paris", tripItem.ID, "Paris", "", 48.8566, 2.3522, "")
	require.NoError(t, err)
	toStage, err := stage.NewStage("stage-lyon", tripItem.ID, "Lyon", "", 45.7640, 4.8357, "")
	require.NoError(t, err)
	require.NoError(t, stageRepository.Save(ctx, fromStage))
	require.NoError(t, stageRepository.Save(ctx, toStage))

	leg, err := travelleg.NewTravelLeg("leg-bus", tripItem.ID, fromStage.ID, toStage.ID, travelleg.TransportBus, "", nil)
	require.NoError(t, err)
	travelLegRepository := postgresadapter.NewTravelLegRepository(pool)
	require.NoError(t, travelLegRepository.Save(ctx, leg))

	persisted, err := travelLegRepository.FindByID(ctx, leg.ID)
	require.NoError(t, err)
	assert.Equal(t, travelleg.TransportBus, persisted.Transport)
}
