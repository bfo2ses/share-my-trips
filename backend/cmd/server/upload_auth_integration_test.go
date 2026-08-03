package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bfosses/sharemytrips/internal/adapter/memory"
	"github.com/bfosses/sharemytrips/internal/domain/auth"
	mediahttp "github.com/bfosses/sharemytrips/internal/http"
)

const uploadTestOrigin = "https://share-my-trips.test"

func TestUploadRoute_RequiresAdminSessionAndSupportsCORS(t *testing.T) {
	authHandler, adminToken, editorToken, familyToken := newUploadAuthHandler(t)
	userResolver := func(ctx context.Context, token string) (*auth.User, error) {
		return authHandler.GetCurrentUser(ctx, auth.GetCurrentUserQuery{Token: token})
	}

	mux := http.NewServeMux()
	mux.Handle("/api/upload", corsMiddleware(uploadTestOrigin, mediahttp.RequireEditor(userResolver, http.NotFoundHandler())))
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	t.Run("CORS preflight", func(t *testing.T) {
		req, err := http.NewRequestWithContext(t.Context(), http.MethodOptions, server.URL+"/api/upload", nil)
		require.NoError(t, err)
		req.Header.Set("Origin", uploadTestOrigin)
		req.Header.Set("Access-Control-Request-Method", http.MethodPost)

		resp, err := server.Client().Do(req)
		require.NoError(t, err)
		defer resp.Body.Close()
		assert.Equal(t, http.StatusNoContent, resp.StatusCode)
		assert.Equal(t, uploadTestOrigin, resp.Header.Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "Content-Type, Authorization", resp.Header.Get("Access-Control-Allow-Headers"))
	})

	for _, tc := range []struct {
		name       string
		token      string
		wantStatus int
	}{
		{name: "missing session", wantStatus: http.StatusUnauthorized},
		{name: "invalid session", token: "unknown-session", wantStatus: http.StatusUnauthorized},
		{name: "family session", token: familyToken, wantStatus: http.StatusForbidden},
		{name: "admin session reaches upload handler", token: adminToken, wantStatus: http.StatusNotFound},
		{name: "editor session reaches upload handler", token: editorToken, wantStatus: http.StatusNotFound},
	} {
		t.Run(tc.name, func(t *testing.T) {
			req, err := http.NewRequestWithContext(t.Context(), http.MethodPost, server.URL+"/api/upload", nil)
			require.NoError(t, err)
			if tc.token != "" {
				req.Header.Set("Authorization", "Bearer "+tc.token)
			}

			resp, err := server.Client().Do(req)
			require.NoError(t, err)
			defer resp.Body.Close()
			assert.Equal(t, tc.wantStatus, resp.StatusCode)
		})
	}
}

func newUploadAuthHandler(t *testing.T) (*auth.Handler, string, string, string) {
	t.Helper()

	userRepo := memory.NewUserRepository()
	sessionRepo := memory.NewSessionRepository()
	handler := auth.NewHandler(userRepo, sessionRepo, memory.NewPasswordResetRepository(), nil, nil, nil)

	admin, err := auth.NewUser("admin-1", "Admin", "admin@example.com", "hash", auth.RoleAdmin)
	require.NoError(t, err)
	family, err := auth.NewUser("family-1", "Family", "family@example.com", "", auth.RoleFamily)
	require.NoError(t, err)
	editor, err := auth.NewUser("editor-1", "Editor", "editor@example.com", "", auth.RoleEditor)
	require.NoError(t, err)
	require.NoError(t, userRepo.Save(t.Context(), admin))
	require.NoError(t, userRepo.Save(t.Context(), family))
	require.NoError(t, userRepo.Save(t.Context(), editor))
	require.NoError(t, sessionRepo.Save(t.Context(), "admin-session", admin.ID))
	require.NoError(t, sessionRepo.Save(t.Context(), "family-session", family.ID))
	require.NoError(t, sessionRepo.Save(t.Context(), "editor-session", editor.ID))

	return handler, "admin-session", "editor-session", "family-session"
}
