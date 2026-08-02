#!/bin/sh

set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
before=$(mktemp "${TMPDIR:-/tmp}/share-my-trips-generated-before.XXXXXX")
after=$(mktemp "${TMPDIR:-/tmp}/share-my-trips-generated-after.XXXXXX")
trap 'rm -f "$before" "$after"' EXIT HUP INT TERM

generated_manifest() {
	{
		for path in \
			backend/internal/graphql/generated.go \
			backend/internal/graphql/models_gen.go
		do
			if [ -f "$repo_root/$path" ]; then
				printf '%s %s\n' "$path" "$(git -C "$repo_root" hash-object "$repo_root/$path")"
			fi
		done

		find "$repo_root/frontend/src/graphql/generated" -type f -print |
			LC_ALL=C sort |
			while IFS= read -r file; do
				path=${file#"$repo_root/"}
				printf '%s %s\n' "$path" "$(git -C "$repo_root" hash-object "$file")"
			done
	} | LC_ALL=C sort
}

generated_manifest >"$before"

(cd "$repo_root/backend" && go run github.com/99designs/gqlgen generate)
(cd "$repo_root/frontend" && npm run codegen)

generated_manifest >"$after"

if ! cmp -s "$before" "$after"; then
	echo "Generated GraphQL files were stale. Regenerated files:" >&2
	diff -u "$before" "$after" >&2 || true
	exit 1
fi
