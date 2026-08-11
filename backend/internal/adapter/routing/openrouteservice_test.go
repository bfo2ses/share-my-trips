package routing

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestOpenRouteServiceClientRequestsGeoJSON(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "application/geo+json", r.Header.Get("Accept"))
		require.Equal(t, "test-key", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/geo+json")
		_, _ = fmt.Fprint(w, `{"features":[{"properties":{"summary":{"distance":12345}}}]}`)
	}))
	defer server.Close()

	var logs bytes.Buffer
	client := newOpenRouteServiceClientWithLogger("test-key", server.URL, server.Client(), log.New(&logs, "", 0))
	distance, err := client.CalculateDrivingDistance(context.Background(), 48.8566, 2.3522, 45.7640, 4.8357)

	require.NoError(t, err)
	require.Equal(t, 12.345, distance)
	require.Empty(t, logs.String())
}

func TestOpenRouteServiceClientUsesHeiGITBaseURL(t *testing.T) {
	require.Equal(t, "https://api.heigit.org/openrouteservice", defaultOpenRouteServiceBaseURL)
}

func TestOpenRouteServiceClientRejectsAGeoJSONRouteWithoutDistance(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = fmt.Fprint(w, `{"features":[{"properties":{"summary":{}}}]}`)
	}))
	defer server.Close()

	client := NewOpenRouteServiceClientWithBaseURL("test-key", server.URL, server.Client())
	_, err := client.CalculateDrivingDistance(context.Background(), 48.8566, 2.3522, 45.7640, 4.8357)

	require.ErrorIs(t, err, ErrRequestFailed)
}

func TestOpenRouteServiceClientLogsProviderFailureWithoutCredentials(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusTooManyRequests)
		_, _ = fmt.Fprint(w, `{"error":"rate limit exceeded"}`)
	}))
	defer server.Close()

	var logs bytes.Buffer
	client := newOpenRouteServiceClientWithLogger("secret-test-key", server.URL, server.Client(), log.New(&logs, "", 0))
	_, err := client.CalculateDrivingDistance(context.Background(), 48.8566, 2.3522, 45.7640, 4.8357)

	require.ErrorIs(t, err, ErrRequestFailed)
	require.Contains(t, logs.String(), "status=429")
	require.Contains(t, logs.String(), "rate limit exceeded")
	require.NotContains(t, logs.String(), "secret-test-key")
}
