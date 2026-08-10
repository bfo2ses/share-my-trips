package main

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGraphQLHTTP_BusDistanceUsesRoadProvider(t *testing.T) {
	provider := &routeDistanceStub{distanceKm: 734.256}
	harness := newGraphQLHarnessWithRouteProvider(t, provider)
	token, _, stageIDs := createTravelLegFixture(t, harness)

	envelope := harness.post(t, `mutation Calculate($from: ID!, $to: ID!) {
		calculateTravelLegDistance(fromStageID: $from, toStageID: $to, transport: BUS) { distanceKm errors { message } }
	}`, map[string]any{"from": stageIDs[0], "to": stageIDs[1]}, token)
	data := decodeData[struct {
		CalculateTravelLegDistance struct {
			DistanceKm *float64    `json:"distanceKm"`
			Errors     []userError `json:"errors"`
		} `json:"calculateTravelLegDistance"`
	}](t, envelope)

	require.Empty(t, data.CalculateTravelLegDistance.Errors)
	require.NotNil(t, data.CalculateTravelLegDistance.DistanceKm)
	require.Equal(t, 734.26, *data.CalculateTravelLegDistance.DistanceKm)
	require.Equal(t, 1, provider.calls)
}
