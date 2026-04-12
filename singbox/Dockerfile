FROM ghcr.io/sagernet/sing-box:v1.10.7

COPY config.json /etc/sing-box/config.json
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
