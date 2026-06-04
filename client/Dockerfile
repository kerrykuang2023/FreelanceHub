FROM mongo:latest
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

ARG NODE_VERSION=20.11.1
ADD https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz /tmp/node.tar.gz
RUN tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.gz \
    && node --version \
    && npm --version

COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE 5137
CMD ["npm", "run", "dev"]
