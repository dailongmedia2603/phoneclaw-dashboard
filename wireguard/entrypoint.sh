#!/bin/bash
# ============================================================
# WireGuard hub for Phone Agent (thay Tailscale)
#
# Chạy với network_mode: host + NET_ADMIN. Việc của container:
#   1. Tạo interface $WG_IFACE (kernel WireGuard) với IP 10.88.0.1/16
#   2. Đồng bộ peer từ $DATA/peers.json (do app server ghi) bằng wg syncconf
#   3. Đưa traffic internet của điện thoại vào sing-box tproxy (exit node,
#      định tuyến proxy theo IP từng máy) — giống thiết kế exit node Tailscale
#   4. Ghi trạng thái `wg show dump` ra $DATA/status.txt cho dashboard
#
# Chỉ đụng tới interface $WG_IFACE và rule có "-i $WG_IFACE" → không ảnh
# hưởng Docker, Tailscale hay dịch vụ khác trên VPS.
# ============================================================
set -euo pipefail

WG_IFACE="${WG_IFACE:-wgpa0}"
WG_PORT="${WG_PORT:-51830}"
WG_ADDR="${WG_ADDR:-10.88.0.1/16}"
WG_MTU="${WG_MTU:-1420}"
TPROXY_PORT="${TPROXY_PORT:-12345}"
TPROXY_MARK="${TPROXY_MARK:-1}"
DATA="${DATA:-/data}"

log() { echo "[wireguard] $*"; }

mkdir -p "$DATA"
if [ ! -s "$DATA/server.key" ]; then
  (umask 077 && wg genkey > "$DATA/server.key")
  log "generated server key"
fi
wg pubkey < "$DATA/server.key" > "$DATA/server.pub"
log "server public key: $(cat "$DATA/server.pub")"

# --- interface ---
if ! ip link show "$WG_IFACE" >/dev/null 2>&1; then
  ip link add "$WG_IFACE" type wireguard
fi
wg set "$WG_IFACE" listen-port "$WG_PORT" private-key "$DATA/server.key"
ip addr replace "$WG_ADDR" dev "$WG_IFACE"
ip link set "$WG_IFACE" mtu "$WG_MTU" up
log "$WG_IFACE up: $WG_ADDR, UDP $WG_PORT"

# --- firewall / exit node ---
# Dùng cùng backend iptables với host (Ubuntu 24.04 + Docker dùng nft)
if iptables-nft -t nat -S 2>/dev/null | grep -q DOCKER; then
  IPT=iptables-nft
elif iptables-legacy -t nat -S 2>/dev/null | grep -q DOCKER; then
  IPT=iptables-legacy
else
  IPT=iptables
fi
log "iptables backend: $IPT"
ipt() { "$IPT" "$@"; }
ensure() { # ensure <table> <chain> <rule...>  (append nếu chưa có)
  local table=$1 chain=$2; shift 2
  ipt -t "$table" -C "$chain" "$@" 2>/dev/null || ipt -t "$table" -A "$chain" "$@"
}
ensure_first() { # chèn lên đầu nếu chưa có
  local table=$1 chain=$2; shift 2
  ipt -t "$table" -C "$chain" "$@" 2>/dev/null || ipt -t "$table" -I "$chain" 1 "$@"
}

ensure_first filter INPUT -p udp --dport "$WG_PORT" -j ACCEPT

# Điện thoại → chính VPS (heartbeat, API) và mạng nội bộ: không qua proxy
ensure mangle PREROUTING -i "$WG_IFACE" -m addrtype --dst-type LOCAL -j RETURN
for net in 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 100.64.0.0/10; do
  ensure mangle PREROUTING -i "$WG_IFACE" -d "$net" -j RETURN
done
# Còn lại (internet) → sing-box tproxy
ensure mangle PREROUTING -i "$WG_IFACE" -p tcp -j TPROXY --on-port "$TPROXY_PORT" --tproxy-mark "$TPROXY_MARK/$TPROXY_MARK"
ensure mangle PREROUTING -i "$WG_IFACE" -p udp -j TPROXY --on-port "$TPROXY_PORT" --tproxy-mark "$TPROXY_MARK/$TPROXY_MARK"
ip rule show | grep -q "fwmark 0x$TPROXY_MARK lookup 100" || ip rule add fwmark "$TPROXY_MARK" table 100
ip route show table 100 2>/dev/null | grep -q "local default" || ip route add local 0.0.0.0/0 dev lo table 100
# VPS có src_valid_mark=1 (Tailscale/wg-quick đặt) → bước rp_filter tra ngược
# địa chỉ nguồn cũng mang mark 1, rơi vào table 100 (local) và loại gói tproxy.
# Ép mọi lookup tới chính subnet điện thoại dùng bảng main.
WG_NET="$(ip -o -4 route show dev "$WG_IFACE" proto kernel | awk '{print $1; exit}')"
if [ -n "$WG_NET" ] && ! ip rule show | grep -q "to $WG_NET lookup main"; then
  ip rule add to "$WG_NET" lookup main priority 5200
fi
# Không bật FORWARD cho $WG_IFACE: máy này không đi tới máy kia, và nếu
# sing-box dừng thì traffic bị chặn (không rò IP thật ra ngoài proxy).

# --- peer sync loop ---
sync_peers() {
  local conf
  conf=$(mktemp)
  {
    echo "[Interface]"
    echo "PrivateKey = $(cat "$DATA/server.key")"
    echo "ListenPort = $WG_PORT"
    if [ -s "$DATA/peers.json" ]; then
      jq -r '.[] | select(.publicKey and .ip) | "\n[Peer]\nPublicKey = \(.publicKey)\nAllowedIPs = \(.ip)/32"' "$DATA/peers.json"
    fi
  } > "$conf"
  if wg syncconf "$WG_IFACE" "$conf"; then
    log "synced $(wg show "$WG_IFACE" peers | wc -l) peer(s)"
  else
    log "WARNING: wg syncconf failed (peers.json invalid?)"
  fi
  rm -f "$conf"
}

trap 'log "stopping (interface giữ nguyên để không rớt kết nối)"; exit 0' TERM INT

last=""
while true; do
  cur=$(md5sum "$DATA/peers.json" 2>/dev/null | cut -d' ' -f1 || true)
  if [ "$cur" != "$last" ]; then
    sync_peers
    last="$cur"
  fi
  wg show "$WG_IFACE" dump > "$DATA/status.tmp" 2>/dev/null && mv "$DATA/status.tmp" "$DATA/status.txt"
  sleep 2 &
  wait $!
done
