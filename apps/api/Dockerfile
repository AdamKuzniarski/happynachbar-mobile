# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /usr/src/app



COPY package*.json ./
RUN npm install

COPY . .

# Dummy URL fürs Generate -(kein Secret!)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

RUN npx prisma generate
RUN npm run build

# Dev deps rauswerfen => kleiner Runtime
RUN npm prune --omit=dev


# --- Runtime Stage ---
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN apk add --no-cache openssl


COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts

EXPOSE 4000
CMD ["node", "dist/src/main"]
