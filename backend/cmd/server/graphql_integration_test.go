package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"

	"github.com/bfosses/sharemytrips/internal/adapter/crypto"
	"github.com/bfosses/sharemytrips/internal/adapter/filesystem"
	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
	graph "github.com/bfosses/sharemytrips/internal/graphql"
)

const testCORSOrigin = "https://share-my-trips.test"

type graphqlHarness struct {
	server *httptest.Server
	client *http.Client
}

type graphqlEnvelope struct {
	Data   json.RawMessage `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

type userError struct {
	Field   *string `json:"field"`
	Message string  `json:"message"`
}

type noopMailer struct{}

func (noopMailer) SendPasswordReset(context.Context, string, string) error { return nil }

func newGraphQLHarness(t *testing.T) *graphqlHarness {
	t.Helper()

	hasher, err := crypto.NewBcryptHasher(bcrypt.DefaultCost)
	require.NoError(t, err)

	tripRepo := memory.NewTripRepository()
	stageRepo := memory.NewStageRepository()
	visitRepo := memory.NewVisitRepository()
	tripChecker := memory.NewTripChecker(tripRepo)

	tripHandler := trip.NewHandler(tripRepo)
	stageHandler := stage.NewHandler(stageRepo, tripChecker, visitRepo)
	visitHandler := visit.NewHandler(visitRepo, tripChecker, stageRepo)

	authHandler := auth.NewHandler(
		memory.NewUserRepository(),
		memory.NewSessionRepository(),
		memory.NewPasswordResetRepository(),
		hasher,
		&crypto.UUIDTokenGenerator{},
		noopMailer{},
	)
	mediaHandler := media.NewHandler(
		memory.NewMediaRepository(),
		filesystem.NewStorage(t.TempDir()),
		tripChecker,
		memory.NewVisitChecker(visitRepo),
	)

	resolver := graph.NewResolver(tripHandler, stageHandler, visitHandler, authHandler, mediaHandler)
	graphqlServer := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))
	mux := http.NewServeMux()
	mux.Handle("/query", corsMiddleware(testCORSOrigin, graph.AuthMiddleware(graphqlServer)))

	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	return &graphqlHarness{server: server, client: server.Client()}
}

func (h *graphqlHarness) post(t *testing.T, query string, variables map[string]any, token string) graphqlEnvelope {
	t.Helper()

	body, err := json.Marshal(map[string]any{"query": query, "variables": variables})
	require.NoError(t, err)

	req, err := http.NewRequestWithContext(t.Context(), http.MethodPost, h.server.URL+"/query", bytes.NewReader(body))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := h.client.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var envelope graphqlEnvelope
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&envelope))
	return envelope
}

func decodeData[T any](t *testing.T, envelope graphqlEnvelope) T {
	t.Helper()
	require.Empty(t, envelope.Errors)

	var data T
	require.NoError(t, json.Unmarshal(envelope.Data, &data))
	return data
}

func TestGraphQLHTTP_CORSPreflight(t *testing.T) {
	harness := newGraphQLHarness(t)
	req, err := http.NewRequestWithContext(t.Context(), http.MethodOptions, harness.server.URL+"/query", nil)
	require.NoError(t, err)
	req.Header.Set("Origin", testCORSOrigin)
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)

	resp, err := harness.client.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusNoContent, resp.StatusCode)
	assert.Equal(t, testCORSOrigin, resp.Header.Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "POST, GET, PATCH, DELETE, OPTIONS", resp.Header.Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "Content-Type, Authorization", resp.Header.Get("Access-Control-Allow-Headers"))
}

func TestGraphQLHTTP_ProtectedMutationRejectsMissingOrInvalidToken(t *testing.T) {
	const mutation = `mutation CreateTrip($input: CreateTripInput!) {
		createTrip(input: $input) { trip { id } errors { field message } }
	}`
	variables := map[string]any{"input": map[string]any{
		"title": "Japan", "country": "Japan", "lat": 35.6762, "lng": 139.6503,
	}}

	for _, tc := range []struct {
		name  string
		token string
	}{
		{name: "missing token"},
		{name: "invalid token", token: "unknown-session"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			harness := newGraphQLHarness(t)
			envelope := harness.post(t, mutation, variables, tc.token)
			data := decodeData[struct {
				CreateTrip struct {
					Trip *struct {
						ID string `json:"id"`
					} `json:"trip"`
					Errors []userError `json:"errors"`
				} `json:"createTrip"`
			}](t, envelope)

			assert.Nil(t, data.CreateTrip.Trip)
			require.Len(t, data.CreateTrip.Errors, 1)
			assert.Equal(t, auth.ErrForbidden.Error(), data.CreateTrip.Errors[0].Message)
		})
	}
}

func TestGraphQLHTTP_MissingOrInvalidTokenReturnsNullMe(t *testing.T) {
	for _, tc := range []struct {
		name  string
		token string
	}{
		{name: "missing token"},
		{name: "invalid token", token: "unknown-session"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			harness := newGraphQLHarness(t)
			envelope := harness.post(t, `query { me { id } }`, nil, tc.token)
			data := decodeData[struct {
				Me *struct {
					ID string `json:"id"`
				} `json:"me"`
			}](t, envelope)

			assert.Nil(t, data.Me)
		})
	}
}

func TestGraphQLHTTP_AdminAuthenticationAndTripCreation(t *testing.T) {
	harness := newGraphQLHarness(t)

	setupEnvelope := harness.post(t, `mutation SetupAdmin($input: SetupAdminInput!) {
		setupAdmin(input: $input) { token account { name email role } errors { field message } }
	}`, map[string]any{"input": map[string]any{
		"name": "Admin", "email": "admin@example.com", "password": "strong-password", "passwordConfirm": "strong-password",
	}}, "")
	setup := decodeData[struct {
		SetupAdmin struct {
			Token   *string `json:"token"`
			Account *struct {
				Name  string `json:"name"`
				Email string `json:"email"`
				Role  string `json:"role"`
			} `json:"account"`
			Errors []userError `json:"errors"`
		} `json:"setupAdmin"`
	}](t, setupEnvelope)
	require.Empty(t, setup.SetupAdmin.Errors)
	require.NotNil(t, setup.SetupAdmin.Token)
	assert.NotEmpty(t, *setup.SetupAdmin.Token)
	require.NotNil(t, setup.SetupAdmin.Account)
	assert.Equal(t, string(graph.AccountRoleAdmin), setup.SetupAdmin.Account.Role)

	loginEnvelope := harness.post(t, `mutation Login($email: String!, $password: String!) {
		login(email: $email, password: $password) { token account { email role } errors { field message } }
	}`, map[string]any{"email": "admin@example.com", "password": "strong-password"}, "")
	login := decodeData[struct {
		Login struct {
			Token   *string `json:"token"`
			Account *struct {
				Email string `json:"email"`
				Role  string `json:"role"`
			} `json:"account"`
			Errors []userError `json:"errors"`
		} `json:"login"`
	}](t, loginEnvelope)
	require.Empty(t, login.Login.Errors)
	require.NotNil(t, login.Login.Token)
	assert.NotEmpty(t, *login.Login.Token)

	meEnvelope := harness.post(t, `query { me { name email role } }`, nil, *login.Login.Token)
	me := decodeData[struct {
		Me *struct {
			Name  string `json:"name"`
			Email string `json:"email"`
			Role  string `json:"role"`
		} `json:"me"`
	}](t, meEnvelope)
	require.NotNil(t, me.Me)
	assert.Equal(t, "Admin", me.Me.Name)
	assert.Equal(t, "admin@example.com", me.Me.Email)
	assert.Equal(t, string(graph.AccountRoleAdmin), me.Me.Role)

	tripEnvelope := harness.post(t, `mutation CreateTrip($input: CreateTripInput!) {
		createTrip(input: $input) {
			trip { id title country description coverPhoto lat lng startDate endDate status }
			errors { field message }
		}
	}`, map[string]any{"input": map[string]any{
		"title":       "Japan 2027",
		"country":     "Japan",
		"description": "Tokyo and Kyoto",
		"coverPhoto":  "japan.jpg",
		"lat":         35.6762,
		"lng":         139.6503,
		"startDate":   "2027-04-01",
		"endDate":     "2027-04-15",
	}}, *login.Login.Token)
	created := decodeData[struct {
		CreateTrip struct {
			Trip *struct {
				ID          string  `json:"id"`
				Title       string  `json:"title"`
				Country     string  `json:"country"`
				Description string  `json:"description"`
				CoverPhoto  string  `json:"coverPhoto"`
				Lat         float64 `json:"lat"`
				Lng         float64 `json:"lng"`
				StartDate   *string `json:"startDate"`
				EndDate     *string `json:"endDate"`
				Status      string  `json:"status"`
			} `json:"trip"`
			Errors []userError `json:"errors"`
		} `json:"createTrip"`
	}](t, tripEnvelope)
	require.Empty(t, created.CreateTrip.Errors)
	require.NotNil(t, created.CreateTrip.Trip)
	assert.NotEmpty(t, created.CreateTrip.Trip.ID)
	assert.Equal(t, "Japan 2027", created.CreateTrip.Trip.Title)
	assert.Equal(t, "Japan", created.CreateTrip.Trip.Country)
	assert.Equal(t, "Tokyo and Kyoto", created.CreateTrip.Trip.Description)
	assert.Equal(t, "japan.jpg", created.CreateTrip.Trip.CoverPhoto)
	assert.Equal(t, 35.6762, created.CreateTrip.Trip.Lat)
	assert.Equal(t, 139.6503, created.CreateTrip.Trip.Lng)
	require.NotNil(t, created.CreateTrip.Trip.StartDate)
	assert.Equal(t, "2027-04-01", *created.CreateTrip.Trip.StartDate)
	require.NotNil(t, created.CreateTrip.Trip.EndDate)
	assert.Equal(t, "2027-04-15", *created.CreateTrip.Trip.EndDate)
	assert.Equal(t, string(graph.TripStatusDraft), created.CreateTrip.Trip.Status)
}
