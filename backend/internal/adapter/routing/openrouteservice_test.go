package routing

import (
	"context"
	"fmt"
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

	client := NewOpenRouteServiceClientWithBaseURL("test-key", server.URL, server.Client())
	distance, err := client.CalculateDrivingDistance(context.Background(), 48.8566, 2.3522, 45.7640, 4.8357)

	require.NoError(t, err)
	require.Equal(t, 12.345, distance)
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
