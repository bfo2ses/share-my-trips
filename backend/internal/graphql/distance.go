package graph

import (
	"context"
	"errors"
	"math"

	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
)

var errRoadDistanceUnavailable = errors.New("road distance calculation is unavailable")

// RouteDistanceProvider is the narrow server-side port for road distance.
// Implementations must return kilometres and must never expose credentials.
type RouteDistanceProvider interface {
	CalculateDrivingDistance(ctx context.Context, fromLat, fromLng, toLat, toLng float64) (float64, error)
}

type distanceCalculator struct{ routeProvider RouteDistanceProvider }

func (c distanceCalculator) calculate(ctx context.Context, transport travelleg.Transport, fromLat, fromLng, toLat, toLng float64) (float64, error) {
	if transport == travelleg.TransportCar || transport == travelleg.TransportBus {
		if c.routeProvider == nil {
			return 0, errRoadDistanceUnavailable
		}
		distanceKm, err := c.routeProvider.CalculateDrivingDistance(ctx, fromLat, fromLng, toLat, toLng)
		if err != nil {
			return 0, err
		}
		return roundDistanceKm(distanceKm), nil
	}
	return roundDistanceKm(haversineDistanceKm(fromLat, fromLng, toLat, toLng)), nil
}

func roundDistanceKm(distanceKm float64) float64 {
	return math.Round(distanceKm*100) / 100
}

func haversineDistanceKm(fromLat, fromLng, toLat, toLng float64) float64 {
	const earthRadiusKm = 6371.0088
	lat1, lng1 := degreesToRadians(fromLat), degreesToRadians(fromLng)
	lat2, lng2 := degreesToRadians(toLat), degreesToRadians(toLng)
	dLat, dLng := lat2-lat1, lng2-lng1
	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1)*math.Cos(lat2)*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * earthRadiusKm * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

func degreesToRadians(value float64) float64 { return value * math.Pi / 180 }
