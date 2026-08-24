# base image
FROM node:26-alpine AS base
WORKDIR /home/node
RUN apk add --no-cache dumb-init wget
USER node
COPY package*.json ./

# builder
FROM base AS builder
ENV NODE_ENV=build
RUN npm ci
COPY --chown=node:node . .
RUN npm run build \
    && npm prune --omit=dev \
    && npm cache clean --force

# production
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /home/node/package*.json ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# dev
FROM base AS dev
ENV NODE_ENV=development
RUN npm ci
COPY --chown=node:node . .
CMD ["npm", "run", "start:dev"]
