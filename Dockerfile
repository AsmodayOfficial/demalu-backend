FROM node:lts-bullseye-slim AS base

# Install necessary packages
RUN apt-get update
RUN apt-get install -y --no-install-recommends \
  openssl \
  python3 \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  pkg-config \
  build-essential \
  curl
RUN rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

FROM base AS builder
WORKDIR /app

# Copy package files and install dependencies
RUN npm install -g @nestjs/cli
COPY package*.json ./

RUN npm install

# Copy application files
COPY . .
RUN npx prisma generate
RUN npm run build

RUN npm i --omit=dev && npm cache clean --force

FROM base AS runner
WORKDIR /app

EXPOSE 4000
ENV PORT=4000
ENV TZ=Asia/Aqtau

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/dist/ ./dist
COPY --chown=nodejs:nodejs --from=builder /app/src/ ./src

USER nodejs

HEALTHCHECK --interval=15s --timeout=15s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:4000/api/v1/web/admin/health" ]
CMD ["npm", "run", "start:prod"]
