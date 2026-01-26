# JAC IRC Proxy - Docker Container
# Bridges mIRC/HexChat (TCP) to JAC WebSocket gateway

FROM node:20-alpine

LABEL maintainer="JAC Chat"
LABEL description="IRC to WebSocket proxy for JAC Chat"
LABEL version="2.0.0"

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (production only, suppress warnings)
RUN npm install --omit=dev --loglevel=error && rm -rf ~/.npm

# Copy proxy script
COPY proxy.js ./

# Environment variables with defaults
ENV HOST=0.0.0.0
ENV PORT=6667
ENV LOG_LEVEL=info
ENV WS_URL=wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway

# Expose IRC port
EXPOSE 6667

# Health check - verify process is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pgrep -x node || exit 1

# Create data and log directories
RUN mkdir -p /data /logs

# Run as non-root user for security
RUN addgroup -g 1001 -S irc && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G irc irc && \
    chown -R irc:irc /app /data /logs

USER irc

# Start the proxy
CMD ["node", "proxy.js"]
