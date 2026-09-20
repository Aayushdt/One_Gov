#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║              GovLink — One-Shot Stack Launcher                             ║
# ║  Usage:  bash start.sh                                                     ║
# ║  Stop:   bash start.sh stop                                                ║
# ║  Reset:  bash start.sh reset   (wipes volumes + reseeds)                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
set -e

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶ $*${RESET}"; }
success() { echo -e "${GREEN}✔ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
error()   { echo -e "${RED}✖ $*${RESET}"; exit 1; }
banner()  { echo -e "\n${BOLD}${BLUE}══════════════════════════════════════${RESET}\n${BOLD}  $*${RESET}\n${BOLD}${BLUE}══════════════════════════════════════${RESET}"; }

# ── Change to script directory ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Detect Docker / Podman ────────────────────────────────────────────────────
detect_compose() {
  if docker compose version &>/dev/null 2>&1 && docker info &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    info "Using Docker"
    return
  fi

  local uid; uid=$(id -u)
  local sock="/run/user/${uid}/podman/podman.sock"
  if [ -S "$sock" ]; then
    export DOCKER_HOST="unix://${sock}"
    COMPOSE_CMD="docker compose"
    info "Using Podman socket at ${sock}"
    return
  fi

  if command -v systemctl &>/dev/null; then
    systemctl --user start podman.socket 2>/dev/null || true
    sleep 1
    if [ -S "$sock" ]; then
      export DOCKER_HOST="unix://${sock}"
      COMPOSE_CMD="docker compose"
      info "Started and using Podman socket at ${sock}"
      return
    fi
  fi

  error "Neither Docker (with access) nor Podman socket found.\n  Fix with:  sudo usermod -aG docker \$USER && newgrp docker\n  Or:        systemctl --user start podman.socket"
}

# ── Ensure .env exists ────────────────────────────────────────────────────────
check_env() {
  if [ ! -f ".env" ]; then
    warn ".env not found — creating with default demo values..."
    cat > .env <<'EOF'
POSTGRES_USER=govlink
POSTGRES_PASSWORD=govlink_secret
JWT_SECRET=govlink_demo_secret_change_in_prod
NODE_ENV=development
CERT_PUBLIC_KEY_BASE64=MCowBQYDK2VwAyEARYI0j1U/JtJ6lMBvKzSrTuY55P9+L9h7zQpHebL2skw=
CERT_PRIVATE_KEY_BASE64=MC4CAQAwBQYDK2VwBCIEIMLyl7QrcbKQeutp78tjf/wPO8o9frL6/uJ9Lcdf45VQ=
ADMIN_EMAIL=rahul@govlink.demo
EOF
    success ".env created"
  else
    success ".env found"
  fi
}

# ── Kill stale pasta/slirp processes holding ports ────────────────────────────
free_ports() {
  local PORTS=(5433 6379 3000 5173)
  local freed=0
  for port in "${PORTS[@]}"; do
    local pids
    pids=$(ss -tlnp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K[0-9]+' || true)
    for pid in $pids; do
      local pname
      pname=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
      warn "Port ${port} occupied by '${pname}' (PID ${pid}) — killing..."
      kill "$pid" 2>/dev/null || true
      freed=1
    done
  done
  if [ "$freed" -eq 1 ]; then
    sleep 2
    success "Stale port processes cleared"
  fi
}

# ── Tear down leftover containers ─────────────────────────────────────────────
cleanup_containers() {
  info "Stopping any running containers..."
  $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  free_ports
}

# ── Wait for backend /health ───────────────────────────────────────────────────
wait_for_health() {
  local url="http://localhost:3000/health"
  local max=60 i=0
  info "Waiting for backend health check (up to $((max * 3))s)..."
  while [ $i -lt $max ]; do
    if curl -sf "$url" &>/dev/null; then
      echo ""
      success "Backend is healthy!"
      return 0
    fi
    printf "."
    sleep 3
    i=$((i + 1))
  done
  echo ""
  warn "Health check timed out. Showing backend logs:"
  $COMPOSE_CMD logs backend --tail=30
  return 1
}

# ── Print final URLs ───────────────────────────────────────────────────────────
print_urls() {
  banner "GovLink is Running 🚀"
  echo -e "  ${BOLD}Frontend Portal${RESET}    →  ${GREEN}http://localhost:5173${RESET}"
  echo -e "  ${BOLD}Backend API${RESET}        →  ${GREEN}http://localhost:3000${RESET}"
  echo -e "  ${BOLD}Health Check${RESET}       →  ${GREEN}http://localhost:3000/health${RESET}"
  echo -e "  ${BOLD}Services Health${RESET}    →  ${GREEN}http://localhost:3000/api/health/services${RESET}"
  echo ""
  echo -e "  ${CYAN}Demo login:${RESET}  rahul@govlink.demo  /  demo123"
  echo -e "  ${CYAN}Admin UI:${RESET}    http://localhost:5173/admin/onboarding"
  echo ""
  echo -e "  ${YELLOW}Logs:${RESET}   ${COMPOSE_CMD} logs -f"
  echo -e "  ${YELLOW}Stop:${RESET}   bash start.sh stop"
  echo -e "  ${YELLOW}Reset:${RESET}  bash start.sh reset"
  echo ""
}

# ══════════════════════════════════════════════════════════════════════════════
CMD="${1:-start}"
detect_compose

case "$CMD" in
  stop)
    banner "Stopping GovLink"
    $COMPOSE_CMD down --remove-orphans
    free_ports
    success "All containers stopped"
    ;;

  reset)
    banner "Resetting GovLink (all data wiped)"
    $COMPOSE_CMD down --volumes --remove-orphans 2>/dev/null || true
    free_ports
    check_env
    info "Rebuilding and reseeding..."
    FORCE_RESEED=true $COMPOSE_CMD up --build -d
    wait_for_health
    print_urls
    ;;

  start|"")
    banner "Starting GovLink"
    check_env
    cleanup_containers
    info "Building images and starting all 7 services (this takes ~2 min on first run)..."
    $COMPOSE_CMD up --build -d
    sleep 5
    info "Tailing backend startup log (Ctrl+C is safe — stack keeps running):"
    timeout 90 $COMPOSE_CMD logs backend --follow 2>/dev/null &
    LOGS_PID=$!
    wait_for_health && kill "$LOGS_PID" 2>/dev/null || true
    echo ""
    info "Container status:"
    $COMPOSE_CMD ps
    echo ""
    print_urls
    if [ ! -f "DEMO_CREDENTIALS.md" ] && command -v node &>/dev/null; then
      info "Generating DEMO_CREDENTIALS.md..."
      node scripts/export_demo_credentials.js 2>/dev/null && success "DEMO_CREDENTIALS.md created" || true
    fi
    ;;

  *)
    echo "Usage: bash start.sh [start|stop|reset]"
    exit 1
    ;;
esac
