#!/usr/bin/env bash
# Deploy instancji VPS (blockchainwares.bard-dev.com). Uruchamiany na VPS:
#   bash /home/barddev/blockchain-wares/blockchain-wares-landing/scripts/deploy_vps.sh
set -euo pipefail

STACK_DIR="${STACK_DIR:-/home/barddev/blockchain-wares}"
CLONE_DIR="$STACK_DIR/blockchain-wares-landing"
VERSION_FILE="$STACK_DIR/version.env"
SERVICE="blockchain-wares"
IMAGE_REPO="blockchain-wares"
KEEP_PREVIOUS_IMAGES=2

# shellcheck disable=SC2329 # wywolywana przez trap ERR
restore_version_file() {
  if [[ -f "$VERSION_FILE.prev" ]]; then
    mv -f "$VERSION_FILE.prev" "$VERSION_FILE"
  else
    rm -f "$VERSION_FILE"
  fi
}

prune_old_images() {
  local current_tag="$1" kept=0 tag
  # `docker images` zwraca obrazy od najnowszego.
  while read -r tag; do
    [[ "$tag" == "$current_tag" || "$tag" == "<none>" ]] && continue
    if ((kept < KEEP_PREVIOUS_IMAGES)); then
      kept=$((kept + 1))
      continue
    fi
    docker image rm "$IMAGE_REPO:$tag" ||
      echo "Ostrzezenie: nie usunieto $IMAGE_REPO:$tag (uzywany przez kontener?)." >&2
  done < <(docker images "$IMAGE_REPO" --format '{{.Tag}}')
}

main() {
  if [[ -n "$(git -C "$CLONE_DIR" status --porcelain)" ]]; then
    echo "Klon $CLONE_DIR ma niezacommitowane zmiany - przerywam." >&2
    exit 1
  fi

  git -C "$CLONE_DIR" fetch --prune origin
  git -C "$CLONE_DIR" merge --ff-only origin/main

  local sha short
  sha="$(git -C "$CLONE_DIR" rev-parse HEAD)"
  short="$(git -C "$CLONE_DIR" rev-parse --short=7 HEAD)"

  if [[ -f "$VERSION_FILE" ]]; then
    cp -p "$VERSION_FILE" "$VERSION_FILE.prev"
  fi
  printf 'APP_VERSION_SHA=%s\nAPP_VERSION_SHORT=%s\n' "$sha" "$short" >"$VERSION_FILE"
  trap restore_version_file ERR
  trap 'restore_version_file; exit 130' INT TERM

  cd "$STACK_DIR"
  docker compose up -d --build --no-deps --wait "$SERVICE"

  trap - ERR INT TERM
  rm -f "$VERSION_FILE.prev"
  docker compose ps "$SERVICE"
  prune_old_images "$short"
}

main "$@"; exit
