// Package routing provides server-side route-distance providers.
package routing

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
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

const defaultOpenRouteServiceBaseURL = "https://api.heigit.org/openrouteservice"

const (
	maxResponseBodyBytes      = 1 << 20
	maxLoggedResponseBodySize = 4 << 10
)

// OpenRouteServiceClient calculates driving distance with the ORS Directions
// API. It exposes no credentials through returned errors.
type OpenRouteServiceClient struct {
	apiKey  string
	baseURL string
	client  *http.Client
	logger  *log.Logger
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
	return newOpenRouteServiceClientWithLogger(apiKey, baseURL, client, log.Default())
}

func newOpenRouteServiceClientWithLogger(apiKey, baseURL string, client *http.Client, logger *log.Logger) *OpenRouteServiceClient {
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}
	if logger == nil {
		logger = log.Default()
	}
	return &OpenRouteServiceClient{
		apiKey:  apiKey,
		baseURL: strings.TrimRight(baseURL, "/"),
		client:  client,
		logger:  logger,
	}
}

// CalculateDrivingDistance returns the ORS road distance in kilometres.
func (c *OpenRouteServiceClient) CalculateDrivingDistance(ctx context.Context, fromLat, fromLng, toLat, toLng float64) (float64, error) {
	if c == nil || strings.TrimSpace(c.apiKey) == "" {
		if c != nil {
			c.logger.Printf("openrouteservice distance request event=error stage=configuration error=%q", ErrUnavailable)
		}
		return 0, ErrUnavailable
	}
	startedAt := time.Now()

	endpoint, err := url.Parse(c.baseURL + "/v2/directions/driving-car")
	if err != nil {
		c.logger.Printf("openrouteservice distance request event=error stage=build_endpoint duration=%s error=%q", time.Since(startedAt), err)
		return 0, ErrUnavailable
	}
	query := endpoint.Query()
	query.Set("start", coordinate(fromLng, fromLat))
	query.Set("end", coordinate(toLng, toLat))
	endpoint.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		c.logger.Printf("openrouteservice distance request event=error stage=build_request duration=%s from=(lat=%.6f,lng=%.6f) to=(lat=%.6f,lng=%.6f) error=%q", time.Since(startedAt), fromLat, fromLng, toLat, toLng, err)
		return 0, ErrRequestFailed
	}
	req.Header.Set("Authorization", c.apiKey)
	req.Header.Set("Accept", "application/geo+json")

	resp, err := c.client.Do(req)
	if err != nil {
		c.logger.Printf("openrouteservice distance request event=error stage=http_call duration=%s from=(lat=%.6f,lng=%.6f) to=(lat=%.6f,lng=%.6f) error=%q", time.Since(startedAt), fromLat, fromLng, toLat, toLng, err)
		return 0, ErrRequestFailed
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBodyBytes))
	if err != nil {
		c.logger.Printf("openrouteservice distance request event=error stage=read_response status=%d content_type=%s duration=%s from=(lat=%.6f,lng=%.6f) to=(lat=%.6f,lng=%.6f) error=%q response=%q", resp.StatusCode, resp.Header.Get("Content-Type"), time.Since(startedAt), fromLat, fromLng, toLat, toLng, err, responseBodySnippet(responseBody))
		return 0, ErrRequestFailed
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		c.logger.Printf("openrouteservice distance request event=error stage=provider_response status=%d content_type=%s duration=%s from=(lat=%.6f,lng=%.6f) to=(lat=%.6f,lng=%.6f) response=%q", resp.StatusCode, resp.Header.Get("Content-Type"), time.Since(startedAt), fromLat, fromLng, toLat, toLng, responseBodySnippet(responseBody))
		return 0, ErrRequestFailed
	}

	var payload struct {
		Routes []struct {
			Summary struct {
				Distance *float64 `json:"distance"`
			} `json:"summary"`
		} `json:"routes"`
		Features []struct {
			Properties struct {
				Summary struct {
					Distance *float64 `json:"distance"`
				} `json:"summary"`
			} `json:"properties"`
		} `json:"features"`
	}
	if err := json.NewDecoder(bytes.NewReader(responseBody)).Decode(&payload); err != nil {
		c.logger.Printf("openrouteservice distance request event=error stage=decode_response status=%d content_type=%s duration=%s from=(lat=%.6f,lng=%.6f) to=(lat=%.6f,lng=%.6f) error=%q response=%q", resp.StatusCode, resp.Header.Get("Content-Type"), time.Since(startedAt), fromLat, fromLng, toLat, toLng, err, responseBodySnippet(responseBody))
		return 0, ErrRequestFailed
	}
	var distanceMeters *float64
	if len(payload.Routes) > 0 {
		distanceMeters = payload.Routes[0].Summary.Distance
	} else if len(payload.Features) > 0 {
		distanceMeters = payload.Features[0].Properties.Summary.Distance
	}
	if distanceMeters == nil || *distanceMeters < 0 {
		c.logger.Printf("openrouteservice distance request event=error stage=validate_response status=%d content_type=%s duration=%s from=(lat=%.6f,lng=%.6f) to=(lat=%.6f,lng=%.6f) reason=missing_or_negative_distance response=%q", resp.StatusCode, resp.Header.Get("Content-Type"), time.Since(startedAt), fromLat, fromLng, toLat, toLng, responseBodySnippet(responseBody))
		return 0, ErrRequestFailed
	}
	return *distanceMeters / 1000, nil
}

func responseBodySnippet(body []byte) string {
	if len(body) > maxLoggedResponseBodySize {
		return string(body[:maxLoggedResponseBodySize]) + "…"
	}
	return string(body)
}

func coordinate(lng, lat float64) string {
	return fmt.Sprintf("%s,%s", strconv.FormatFloat(lng, 'f', -1, 64), strconv.FormatFloat(lat, 'f', -1, 64))
}
