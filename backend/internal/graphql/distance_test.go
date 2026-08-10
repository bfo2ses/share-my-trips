package graph

import (
	"context"
	"testing"

	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/stretchr/testify/require"
)

type distanceProviderStub struct {
	distanceKm float64
}

func (s distanceProviderStub) CalculateDrivingDistance(context.Context, float64, float64, float64, float64) (float64, error) {
	return s.distanceKm, nil
}

func TestDistanceCalculator_RoundsCalculatedDistanceToTwoDecimals(t *testing.T) {
	calculator := distanceCalculator{routeProvider: distanceProviderStub{distanceKm: 12.345}}

	distanceKm, err := calculator.calculate(context.Background(), travelleg.TransportCar, 0, 0, 0, 0)

	require.NoError(t, err)
	require.Equal(t, 12.35, distanceKm)
}

func TestDistanceCalculator_RoundsHaversineDistanceToTwoDecimals(t *testing.T) {
	calculator := distanceCalculator{}

	distanceKm, err := calculator.calculate(context.Background(), travelleg.TransportTrain, 37.7749, -122.4194, 34.0522, -118.2437)

	require.NoError(t, err)
	require.Equal(t, 559.12, distanceKm)
}
