FROM alpine:3.20

RUN apk add --no-cache wireguard-tools iproute2 iptables jq bash

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
