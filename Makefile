.PHONY: check check-fast check-generated backend-check backend-format backend-test frontend-check frontend-test
.NOTPARALLEL:

check: backend-check frontend-check check-generated

check-fast: backend-format backend-test frontend-check

backend-check: backend-format
	cd backend && go vet ./...
	cd backend && go test -race ./...
	cd backend && go build ./...

backend-format:
	@unformatted_file="$$(mktemp "$${TMPDIR:-/tmp}/share-my-trips-gofmt.XXXXXX")"; \
	trap 'rm -f "$$unformatted_file"' EXIT HUP INT TERM; \
	if ! find backend -name '*.go' -type f -not -path '*/vendor/*' -print | \
		while IFS= read -r file; do gofmt -l "$$file" || exit 1; done >"$$unformatted_file"; then \
		echo "Unable to check Go formatting" >&2; \
		exit 1; \
	fi; \
	unformatted="$$(cat "$$unformatted_file")"; \
	if [ -n "$$unformatted" ]; then \
		echo "Go files need formatting:"; \
		echo "$$unformatted"; \
		exit 1; \
	fi

backend-test:
	cd backend && go test ./...

frontend-check:
	$(MAKE) frontend-test
	cd frontend && npm run typecheck
	cd frontend && npm run lint
	cd frontend && npm run build

frontend-test:
	cd frontend && npm test

check-generated:
	./scripts/check-generated.sh
