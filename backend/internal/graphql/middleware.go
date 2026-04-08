package graph

import (
	"net/http"
	"strings"
)

// AuthMiddleware extracts the Bearer token from the Authorization header
// and stores it in the request context for resolvers to use.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := bearerToken(r.Header.Get("Authorization"))
		if token != "" {
			r = r.WithContext(WithSessionToken(r.Context(), token))
		}
		next.ServeHTTP(w, r)
	})
}

func bearerToken(header string) string {
	const prefix = "Bearer "
	if strings.HasPrefix(header, prefix) {
		return strings.TrimPrefix(header, prefix)
	}
	return ""
}
