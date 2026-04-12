#!/bin/bash
# ============================================================
# Exit Node Zero-Leak Test Suite
# Run on VPS after deployment to verify infrastructure
# ============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}PASS${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}FAIL${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}WARN${NC} $1"; WARN=$((WARN+1)); }

echo "============================================"
echo " Exit Node Zero-Leak Test Suite"
echo " $(date)"
echo "============================================"
echo ""

# --- Group 1: VPS Infrastructure ---
echo "--- Group 1: VPS Infrastructure ---"

# 1.1 sing-box container
if docker compose ps singbox 2>/dev/null | grep -q "Up\|running"; then
  pass "sing-box container is running"
else
  fail "sing-box container is NOT running"
fi

# 1.2 IPv4 forwarding
if [ "$(sysctl -n net.ipv4.ip_forward 2>/dev/null)" = "1" ]; then
  pass "IPv4 forwarding enabled"
else
  fail "IPv4 forwarding disabled"
fi

# 1.3 IPv6 forwarding disabled
if [ "$(sysctl -n net.ipv6.conf.all.forwarding 2>/dev/null)" = "0" ]; then
  pass "IPv6 forwarding disabled"
else
  warn "IPv6 forwarding still enabled — run: sysctl -w net.ipv6.conf.all.forwarding=0"
fi

# 1.4 sing-box config valid
if docker compose exec -T singbox sing-box check -c /etc/sing-box/config.json 2>/dev/null; then
  pass "sing-box config is valid"
else
  fail "sing-box config is INVALID"
fi

echo ""

# --- Group 2: Tailscale Exit Node ---
echo "--- Group 2: Tailscale Exit Node ---"

# 2.1 Tailscale running
if tailscale status 2>/dev/null | head -1 | grep -q ""; then
  pass "Tailscale is running"
else
  fail "Tailscale is not running"
fi

# 2.2 Exit node advertised
if tailscale status 2>/dev/null | grep -qi "exit node"; then
  pass "Exit node is advertised"
else
  warn "Exit node may not be advertised — run: tailscale set --advertise-exit-node"
fi

echo ""

# --- Group 3: iptables Rules ---
echo "--- Group 3: iptables / Routing ---"

# 3.1 tproxy rules exist
if iptables -t mangle -L PREROUTING -n 2>/dev/null | grep -q "TPROXY.*12345"; then
  pass "TPROXY iptables rules configured (port 12345)"
else
  warn "TPROXY rules not found — run: bash singbox/setup-iptables.sh"
fi

# 3.2 routing table 100
if ip rule show 2>/dev/null | grep -q "fwmark.*0x1.*table 100"; then
  pass "Routing table 100 for marked packets"
else
  warn "Routing table 100 not configured"
fi

echo ""

# --- Group 4: Dashboard API ---
echo "--- Group 4: Dashboard API ---"

# 4.1 Exit node API accessible
if curl -sf http://localhost:9000/api/health 2>/dev/null | grep -q "ok"; then
  pass "Dashboard API is healthy"
else
  fail "Dashboard API is not responding"
fi

# 4.2 Exit node status endpoint
EXIT_STATUS=$(curl -sf http://localhost:9000/api/exit-node/status 2>/dev/null)
if echo "$EXIT_STATUS" | grep -q '"success":true'; then
  DEVICE_COUNT=$(echo "$EXIT_STATUS" | grep -o '"count":[0-9]*' | cut -d: -f2)
  pass "Exit node status API works (${DEVICE_COUNT:-0} devices configured)"
else
  warn "Exit node status API not accessible (may need auth)"
fi

echo ""

# --- Group 5: Docker containers health ---
echo "--- Group 5: Docker Containers ---"

for SVC in postgres app nginx singbox; do
  if docker compose ps "$SVC" 2>/dev/null | grep -q "Up\|running"; then
    pass "$SVC container is running"
  else
    fail "$SVC container is NOT running"
  fi
done

echo ""
echo "============================================"
echo -e " Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${YELLOW}${WARN} warnings${NC}"
echo "============================================"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Fix failures before proceeding with iPhone testing."
  exit 1
fi

if [ $WARN -gt 0 ]; then
  echo ""
  echo "Warnings should be resolved for full zero-leak protection."
fi

echo ""
echo "Next: Test on iPhone"
echo "  1. Set Tailscale exit node on iPhone"
echo "  2. Open browserleaks.com in Safari"
echo "  3. Verify: IPv4=US, IPv6=None, DNS=Cloudflare, WebRTC=US"
