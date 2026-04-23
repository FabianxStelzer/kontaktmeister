FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat curl
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app /app

EXPOSE 3000
CMD ["npm", "run", "start"]
