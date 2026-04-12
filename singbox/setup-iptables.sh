#!/bin/bash
# Setup iptables rules to redirect Tailscale exit node traffic to sing-box tproxy
# Run this ONCE on VPS after docker compose up
#
# This script redirects all forwarded traffic from tailscale0 interface
# to sing-box's tproxy port (12345), enabling sing-box to route traffic
# per source Tailscale IP.

set -e

TPROXY_PORT=12345
MARK=1

echo "[setup-iptables] Configuring tproxy redirect for Tailscale exit node traffic..."

# Clean up existing rules (idempotent)
iptables -t mangle -D PREROUTING -i tailscale0 -p tcp -j TPROXY --on-port $TPROXY_PORT --tproxy-mark $MARK/$MARK 2>/dev/null || true
iptables -t mangle -D PREROUTING -i tailscale0 -p udp -j TPROXY --on-port $TPROXY_PORT --tproxy-mark $MARK/$MARK 2>/dev/null || true

# Skip Tailscale internal traffic (CGNAT range)
iptables -t mangle -D PREROUTING -i tailscale0 -d 100.64.0.0/10 -j RETURN 2>/dev/null || true
iptables -t mangle -A PREROUTING -i tailscale0 -d 100.64.0.0/10 -j RETURN

# Skip private network traffic
iptables -t mangle -D PREROUTING -i tailscale0 -d 10.0.0.0/8 -j RETURN 2>/dev/null || true
iptables -t mangle -A PREROUTING -i tailscale0 -d 10.0.0.0/8 -j RETURN
iptables -t mangle -D PREROUTING -i tailscale0 -d 172.16.0.0/12 -j RETURN 2>/dev/null || true
iptables -t mangle -A PREROUTING -i tailscale0 -d 172.16.0.0/12 -j RETURN
iptables -t mangle -D PREROUTING -i tailscale0 -d 192.168.0.0/16 -j RETURN 2>/dev/null || true
iptables -t mangle -A PREROUTING -i tailscale0 -d 192.168.0.0/16 -j RETURN

# Redirect TCP traffic from tailscale0 to tproxy
iptables -t mangle -A PREROUTING -i tailscale0 -p tcp -j TPROXY \
  --on-port $TPROXY_PORT --tproxy-mark $MARK/$MARK

# Redirect UDP traffic from tailscale0 to tproxy
iptables -t mangle -A PREROUTING -i tailscale0 -p udp -j TPROXY \
  --on-port $TPROXY_PORT --tproxy-mark $MARK/$MARK

# Setup routing for marked packets
ip rule add fwmark $MARK table 100 2>/dev/null || true
ip route add local 0.0.0.0/0 dev lo table 100 2>/dev/null || true

# Disable IPv6 forwarding
sysctl -w net.ipv6.conf.all.forwarding=0
sysctl -w net.ipv6.conf.default.forwarding=0

# Enable IPv4 forwarding
sysctl -w net.ipv4.ip_forward=1

echo "[setup-iptables] Done. Tailscale exit node traffic will be routed through sing-box tproxy on port $TPROXY_PORT"
echo "[setup-iptables] Verify: iptables -t mangle -L PREROUTING -n -v"
