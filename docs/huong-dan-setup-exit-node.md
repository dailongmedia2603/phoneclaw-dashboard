# Hướng dẫn Setup Exit Node + Zero Leak

Tài liệu này mô tả cách setup hoàn chỉnh hệ thống Zero IP Leak dùng Tailscale Exit Node + sing-box trên VPS mới.

## Tổng quan kiến trúc

```
iPhone → Tailscale Exit Node (1 tunnel duy nhất)
           └── VPS (phone-agent-gateway)
                 ├── sing-box tproxy → US/VN proxy (zero-leak)
                 └── Dashboard điều khiển qua API
```

## Yêu cầu VPS

- Ubuntu 20.04+ / Debian 11+
- 1+ CPU, 2+ GB RAM
- Tailscale account (free plan đủ)
- Port 22, 80, 443 mở cho management
- IPv4 public address

## Setup từ đầu (VPS mới)

### Bước 1: Cài Docker + Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin sshpass
```

### Bước 2: Cài Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up --hostname=phone-agent-gateway --advertise-exit-node --accept-routes
```

Copy URL xuất hiện, dán vào browser để login vào Tailscale account.

### Bước 3: Enable IP forwarding

```bash
echo 'net.ipv4.ip_forward=1' | tee /etc/sysctl.d/99-exit-node.conf
echo 'net.ipv6.conf.all.forwarding=0' | tee -a /etc/sysctl.d/99-exit-node.conf
sysctl -p /etc/sysctl.d/99-exit-node.conf
```

### Bước 4: Deploy code từ git

```bash
cd /opt
git clone <REPO_URL> phoneclaw-dashboard
cd phoneclaw-dashboard
# Tạo .env theo template
cp .env.example .env
nano .env  # Điền config
docker compose up -d
```

### Bước 5: Setup iptables cho sing-box tproxy

```bash
bash /opt/phoneclaw-dashboard/singbox/setup-iptables.sh
```

### Bước 6: Cấu hình Tailscale ACL

Vào **https://login.tailscale.com/admin/acls/file**

Paste ACL sau:

```json
{
  "tagOwners": {
    "tag:phone":   ["autogroup:admin"],
    "tag:gateway": ["autogroup:admin"],
    "tag:admin":   ["autogroup:admin"]
  },

  "autoApprovers": {
    "exitNode": ["tag:gateway"]
  },

  "acls": [
    {"action": "accept", "src": ["tag:admin"],   "dst": ["tag:gateway:*"]},
    {"action": "accept", "src": ["tag:gateway"], "dst": ["tag:phone:*"]},
    {"action": "accept", "src": ["tag:phone"],   "dst": ["tag:gateway:*"]},
    {"action": "accept", "src": ["tag:phone"],   "dst": ["autogroup:internet:*"]}
  ],

  "ssh": [
    {
      "action": "accept",
      "src": ["autogroup:admin"],
      "dst": ["autogroup:self"],
      "users": ["root", "autogroup:nonroot"]
    }
  ]
}
```

Save.

### Bước 7: Gán tag cho VPS

Vào **https://login.tailscale.com/admin/machines**:

1. Tìm `phone-agent-gateway` → click "..." → Edit tags
2. Thêm tag `gateway`
3. Click "..." → Edit route settings → Check "Use as exit node"

### Bước 8: Tạo Pre-auth Key cho phones

Vào **https://login.tailscale.com/admin/settings/keys**:

1. Generate auth key
2. Config:
   - Reusable: ✅ ON
   - Ephemeral: ❌ OFF
   - Pre-approved: ✅ ON
   - Tags: `tag:phone`
   - Expiration: 90 days
3. Generate → **copy và lưu an toàn**

## Checklist verify

```bash
bash /opt/phoneclaw-dashboard/scripts/test-exit-node.sh
```

Kết quả cần: PASS hết, chỉ có warning về admin approval nếu chưa approve exit node.

## Bảo mật VPS

### Đổi password SSH

```bash
passwd
```

### Setup SSH key (khuyến nghị)

```bash
# Trên máy local
ssh-copy-id root@<VPS_IP>

# Trên VPS — disable password login
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

### Firewall cơ bản

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
```

Tailscale + Docker tự handle firewall rules riêng.

## Troubleshooting

### iPhone báo "No Internet Connection" khi bật exit node

→ Kiểm tra ACL có rule `"src": ["tag:phone"], "dst": ["autogroup:internet:*"]` chưa

### Option "Use as exit node" không hiện trên iPhone app

→ Kiểm tra Tailscale admin đã approve exit node chưa. Vào machines → phone-agent-gateway → Edit route settings → Check "Use as exit node"

### sing-box crash loop

→ Check Docker image version: phải là `v1.10.7`, không được dùng `latest` (v1.12+ phá vỡ config)

### Dashboard không reload được sing-box

→ Check `/var/run/docker.sock` đã mount vào app container chưa
→ Check `singbox/` directory đã mount vào `/app/singbox` chưa
