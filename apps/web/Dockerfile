# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .

# Ensure public/ exists (some projects don't have it)
RUN mkdir -p public

RUN npm run build

# Dev deps rauswerfen => kleiner Runtime
RUN npm prune --omit=dev

# --- Runtime Stage ---
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy only what is needed to run Next.js
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.* ./

EXPOSE 3000

CMD ["npm", "run", "start"]
