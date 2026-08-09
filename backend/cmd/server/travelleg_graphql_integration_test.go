package main

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type routeDistanceStub struct {
	distanceKm float64
	calls      int
}

func (s *routeDistanceStub) CalculateDrivingDistance(_ context.Context, _, _, _, _ float64) (float64, error) {
	s.calls++
	return s.distanceKm, nil
}

func TestGraphQLHTTP_TravelLegCRUDAndDirectDistance(t *testing.T) {
	harness := newGraphQLHarness(t)
	token, tripID, stageIDs := createTravelLegFixture(t, harness)

	unauthorized := harness.post(t, `mutation CreateTravelLeg($input: CreateTravelLegInput!) {
		createTravelLeg(input: $input) { travelLeg { id } errors { message } }
	}`, map[string]any{"input": map[string]any{
		"tripID": tripID, "fromStageID": stageIDs[0], "toStageID": stageIDs[1], "transport": "CAR",
	}}, "")
	unauthorizedData := decodeData[struct {
		CreateTravelLeg struct {
			TravelLeg any         `json:"travelLeg"`
			Errors    []userError `json:"errors"`
		} `json:"createTravelLeg"`
	}](t, unauthorized)
	assert.Nil(t, unauthorizedData.CreateTravelLeg.TravelLeg)
	require.Len(t, unauthorizedData.CreateTravelLeg.Errors, 1)

	createdEnvelope := harness.post(t, `mutation CreateTravelLeg($input: CreateTravelLegInput!) {
		createTravelLeg(input: $input) {
			travelLeg { id tripID fromStageID toStageID transport description distanceKm }
			errors { field message }
		}
	}`, map[string]any{"input": map[string]any{
		"tripID": tripID, "fromStageID": stageIDs[0], "toStageID": stageIDs[1], "transport": "CAR", "description": "Highway 1", "distanceKm": 812.5,
	}}, token)
	created := decodeData[struct {
		CreateTravelLeg struct {
			TravelLeg *struct {
				ID          string   `json:"id"`
				TripID      string   `json:"tripID"`
				FromStageID string   `json:"fromStageID"`
				ToStageID   string   `json:"toStageID"`
				Transport   string   `json:"transport"`
				Description *string  `json:"description"`
				DistanceKm  *float64 `json:"distanceKm"`
			} `json:"travelLeg"`
			Errors []userError `json:"errors"`
		} `json:"createTravelLeg"`
	}](t, createdEnvelope)
	require.Empty(t, created.CreateTravelLeg.Errors)
	require.NotNil(t, created.CreateTravelLeg.TravelLeg)
	assert.Equal(t, tripID, created.CreateTravelLeg.TravelLeg.TripID)
	assert.Equal(t, "CAR", created.CreateTravelLeg.TravelLeg.Transport)
	require.NotNil(t, created.CreateTravelLeg.TravelLeg.DistanceKm)
	assert.Equal(t, 812.5, *created.CreateTravelLeg.TravelLeg.DistanceKm)

	listEnvelope := harness.post(t, `query TravelLegs($tripID: ID!) {
		travelLegs(tripID: $tripID) { id transport }
	}`, map[string]any{"tripID": tripID}, "")
	list := decodeData[struct {
		TravelLegs []struct {
			ID        string `json:"id"`
			Transport string `json:"transport"`
		} `json:"travelLegs"`
	}](t, listEnvelope)
	require.Len(t, list.TravelLegs, 1)
	assert.Equal(t, created.CreateTravelLeg.TravelLeg.ID, list.TravelLegs[0].ID)

	distanceEnvelope := harness.post(t, `mutation Calculate($from: ID!, $to: ID!) {
		calculateTravelLegDistance(fromStageID: $from, toStageID: $to, transport: TRAIN) { distanceKm errors { field message } }
	}`, map[string]any{"from": stageIDs[0], "to": stageIDs[1]}, token)
	distance := decodeData[struct {
		CalculateTravelLegDistance struct {
			DistanceKm *float64    `json:"distanceKm"`
			Errors     []userError `json:"errors"`
		} `json:"calculateTravelLegDistance"`
	}](t, distanceEnvelope)
	require.Empty(t, distance.CalculateTravelLegDistance.Errors)
	require.NotNil(t, distance.CalculateTravelLegDistance.DistanceKm)
	assert.InDelta(t, 559.12, *distance.CalculateTravelLegDistance.DistanceKm, 1)
}

func TestGraphQLHTTP_CarDistanceUsesProviderWithoutPersisting(t *testing.T) {
	provider := &routeDistanceStub{distanceKm: 734.25}
	harness := newGraphQLHarnessWithRouteProvider(t, provider)
	token, tripID, stageIDs := createTravelLegFixture(t, harness)

	envelope := harness.post(t, `mutation Calculate($from: ID!, $to: ID!) {
		calculateTravelLegDistance(fromStageID: $from, toStageID: $to, transport: CAR) { distanceKm errors { message } }
	}`, map[string]any{"from": stageIDs[0], "to": stageIDs[1]}, token)
	data := decodeData[struct {
		CalculateTravelLegDistance struct {
			DistanceKm *float64    `json:"distanceKm"`
			Errors     []userError `json:"errors"`
		} `json:"calculateTravelLegDistance"`
	}](t, envelope)
	require.Empty(t, data.CalculateTravelLegDistance.Errors)
	require.NotNil(t, data.CalculateTravelLegDistance.DistanceKm)
	assert.Equal(t, 734.25, *data.CalculateTravelLegDistance.DistanceKm)
	assert.Equal(t, 1, provider.calls)

	legsEnvelope := harness.post(t, `query TravelLegs($tripID: ID!) { travelLegs(tripID: $tripID) { id } }`, map[string]any{"tripID": tripID}, "")
	legs := decodeData[struct {
		TravelLegs []struct{ ID string } `json:"travelLegs"`
	}](t, legsEnvelope)
	assert.Empty(t, legs.TravelLegs)
}

func TestGraphQLHTTP_UnconfiguredCarDistanceReturnsPayloadError(t *testing.T) {
	harness := newGraphQLHarness(t)
	token, _, stageIDs := createTravelLegFixture(t, harness)

	envelope := harness.post(t, `mutation Calculate($from: ID!, $to: ID!) {
		calculateTravelLegDistance(fromStageID: $from, toStageID: $to, transport: CAR) { distanceKm errors { field message } }
	}`, map[string]any{"from": stageIDs[0], "to": stageIDs[1]}, token)
	data := decodeData[struct {
		CalculateTravelLegDistance struct {
			DistanceKm *float64    `json:"distanceKm"`
			Errors     []userError `json:"errors"`
		} `json:"calculateTravelLegDistance"`
	}](t, envelope)
	assert.Nil(t, data.CalculateTravelLegDistance.DistanceKm)
	require.Len(t, data.CalculateTravelLegDistance.Errors, 1)
	assert.Equal(t, "distanceKm", *data.CalculateTravelLegDistance.Errors[0].Field)
	assert.Equal(t, "road distance calculation is unavailable", data.CalculateTravelLegDistance.Errors[0].Message)
}

func createTravelLegFixture(t *testing.T, harness *graphqlHarness) (token, tripID string, stageIDs []string) {
	t.Helper()
	setupEnvelope := harness.post(t, `mutation SetupAdmin($input: SetupAdminInput!) {
		setupAdmin(input: $input) { token errors { message } }
	}`, map[string]any{"input": map[string]any{
		"name": "Admin", "email": "admin@example.com", "password": "strong-password", "passwordConfirm": "strong-password",
	}}, "")
	setup := decodeData[struct {
		SetupAdmin struct {
			Token  *string     `json:"token"`
			Errors []userError `json:"errors"`
		} `json:"setupAdmin"`
	}](t, setupEnvelope)
	require.Empty(t, setup.SetupAdmin.Errors)
	require.NotNil(t, setup.SetupAdmin.Token)
	token = *setup.SetupAdmin.Token

	tripEnvelope := harness.post(t, `mutation CreateTrip($input: CreateTripInput!) {
		createTrip(input: $input) { trip { id } errors { message } }
	}`, map[string]any{"input": map[string]any{
		"title": "California", "country": "US", "lat": 37.7749, "lng": -122.4194,
	}}, token)
	tripData := decodeData[struct {
		CreateTrip struct {
			Trip   *struct{ ID string } `json:"trip"`
			Errors []userError          `json:"errors"`
		} `json:"createTrip"`
	}](t, tripEnvelope)
	require.Empty(t, tripData.CreateTrip.Errors)
	require.NotNil(t, tripData.CreateTrip.Trip)
	tripID = tripData.CreateTrip.Trip.ID

	for _, stage := range []struct {
		city string
		lat  float64
		lng  float64
	}{
		{city: "San Francisco", lat: 37.7749, lng: -122.4194},
		{city: "Los Angeles", lat: 34.0522, lng: -118.2437},
	} {
		stageEnvelope := harness.post(t, `mutation AddStage($input: AddStageInput!) {
			addStage(input: $input) { stage { id } errors { message } }
		}`, map[string]any{"input": map[string]any{
			"tripID": tripID, "city": stage.city, "lat": stage.lat, "lng": stage.lng,
		}}, token)
		stageData := decodeData[struct {
			AddStage struct {
				Stage  *struct{ ID string } `json:"stage"`
				Errors []userError          `json:"errors"`
			} `json:"addStage"`
		}](t, stageEnvelope)
		require.Empty(t, stageData.AddStage.Errors)
		require.NotNil(t, stageData.AddStage.Stage)
		stageIDs = append(stageIDs, stageData.AddStage.Stage.ID)
	}
	return token, tripID, stageIDs
}
