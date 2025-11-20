FROM node:lts-bullseye-slim AS base

WORKDIR /app
ENV NODE_ENV=development

RUN apt update && apt install -y --no-install-recommends \
  openssl procps python3 python3-pip python3-dev build-essential fonts-noto libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-bin pkg-config libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @nestjs/cli
COPY package*.json ./
RUN npm install

EXPOSE 4000
ENV PORT=4000

COPY . .
RUN npx prisma generate

ENV TZ=Asia/Aqtau

CMD ["npm", "run", "start:dev"]
