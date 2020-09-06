FROM alpine:3.12
LABEL maintainer="tjc@wintrmute.net"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# Chrome's sandboxing doesn't work in a Docker container - but that probably doesn't matter,
# since the Docker container is itself a kind of sandbox.
ENV CHROME_EXTRA_FLAG="--no-sandbox"
ENV TZ=Australia/Sydney
RUN apk update && \
    apk add chromium chromium-chromedriver nodejs npm curl && \
    adduser -D -u 1000 speedtest && \
    mkdir -p /app
COPY . /app/
WORKDIR /app
RUN npm install --unsafe-perm -g && chown -R 1000 /app
USER 1000
ENTRYPOINT ["/usr/bin/abb-speedtest"]
