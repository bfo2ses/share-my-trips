// Package routing provides server-side route-distance providers.
package routing

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

var (
	// ErrUnavailable means no routable-distance provider is configured.
	ErrUnavailable = errors.New("road distance calculation is unavailable")
	// ErrRequestFailed intentionally hides provider response details and URLs.
	ErrRequestFailed = errors.New("road distance calculation failed")
)

const defaultOpenRouteServiceBaseURL = "https://api.openrouteservice.org"

// OpenRouteServiceClient calculates driving distance with the ORS Directions
// API. It exposes no credentials through returned errors.
type OpenRouteServiceClient struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// NewOpenRouteServiceClient creates the production client. An empty key keeps
// the service gracefully unavailable instead of preventing server startup.
func NewOpenRouteServiceClient(apiKey string) *OpenRouteServiceClient {
	return NewOpenRouteServiceClientWithBaseURL(apiKey, defaultOpenRouteServiceBaseURL, &http.Client{Timeout: 10 * time.Second})
}

// NewOpenRouteServiceClientWithBaseURL is intended for isolated adapter tests.
// Production wiring uses NewOpenRouteServiceClient so its destination remains
// allowlisted to ORS.
func NewOpenRouteServiceClientWithBaseURL(apiKey, baseURL string, client *http.Client) *OpenRouteServiceClient {
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}
	return &OpenRouteServiceClient{apiKey: apiKey, baseURL: strings.TrimRight(baseURL, "/"), client: client}
}

// CalculateDrivingDistance returns the ORS road distance in kilometres.
func (c *OpenRouteServiceClient) CalculateDrivingDistance(ctx context.Context, fromLat, fromLng, toLat, toLng float64) (float64, error) {
	if c == nil || strings.TrimSpace(c.apiKey) == "" {
		return 0, ErrUnavailable
	}

	endpoint, err := url.Parse(c.baseURL + "/v2/directions/driving-car")
	if err != nil {
		return 0, ErrUnavailable
	}
	query := endpoint.Query()
	query.Set("start", coordinate(fromLng, fromLat))
	query.Set("end", coordinate(toLng, toLat))
	endpoint.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return 0, ErrRequestFailed
	}
	req.Header.Set("Authorization", c.apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return 0, ErrRequestFailed
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return 0, ErrRequestFailed
	}

	var payload struct {
		Routes []struct {
			Summary struct {
				Distance float64 `json:"distance"`
			} `json:"summary"`
		} `json:"routes"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&payload); err != nil {
		return 0, ErrRequestFailed
	}
	if len(payload.Routes) == 0 || payload.Routes[0].Summary.Distance < 0 {
		return 0, ErrRequestFailed
	}
	return payload.Routes[0].Summary.Distance / 1000, nil
}

func coordinate(lng, lat float64) string {
	return fmt.Sprintf("%s,%s", strconv.FormatFloat(lng, 'f', -1, 64), strconv.FormatFloat(lat, 'f', -1, 64))
}
