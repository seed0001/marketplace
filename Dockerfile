FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Auth.js may temporarily receive several chunked session cookies after a
# deployment or secret rotation. Node's 16 KB default rejects those requests
# with HTTP 431 before Auth.js can replace the stale session.
ENV NODE_OPTIONS="--max-http-header-size=65536"
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/src/generated ./src/generated
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/prisma.config.ts ./

EXPOSE 3000
CMD npx prisma db push && npx next start
