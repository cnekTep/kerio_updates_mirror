# Base image with Node.js
FROM node:18

# Setting up working directory and environment variables
ENV NODE_ENV=production
WORKDIR /var/lib/mirror

# Copying all necessary files and folders into the container
COPY ./install/libssl1.0.2_1.0.2u-1_amd64.deb /var/lib/mirror/tmp/
COPY ./install/mirror /var/lib/mirror/

# Installing libssl and application dependencies
RUN apt update && apt install -y --no-install-recommends \
    && dpkg -i /var/lib/mirror/tmp/libssl1.0.2_1.0.2u-1_amd64.deb \
    && rm -f /var/lib/mirror/tmp/libssl1.0.2_1.0.2u-1_amd64.deb \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --omit=dev \
    && rm -rf /root/.npm

# Command to start the application
CMD ["bash", "-c", "node /var/lib/mirror/monitor.js | tee /var/log/mirror.log"]
