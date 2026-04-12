#!/bin/sh
set -e

# Enable legacy DNS format support (sing-box 1.12+)
export ENABLE_DEPRECATED_LEGACY_DNS_SERVERS=true

# Disable IPv6 forwarding (prevent IPv6 leak)
sysctl -w net.ipv6.conf.all.forwarding=0 2>/dev/null || true
sysctl -w net.ipv6.conf.default.forwarding=0 2>/dev/null || true

# Setup tproxy routing rules
ip rule add fwmark 1 table 100 2>/dev/null || true
ip route add local 0.0.0.0/0 dev lo table 100 2>/dev/null || true

echo "[entrypoint] Starting sing-box with tproxy mode"
exec sing-box run -c /etc/sing-box/config.json
