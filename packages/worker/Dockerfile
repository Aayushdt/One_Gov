FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY packages/backend/package.json ./package.json
RUN npm install

COPY packages/backend/prisma ./prisma
RUN npx prisma generate

COPY packages/backend ./packages/backend
COPY packages/worker ./packages/worker

WORKDIR /app/packages/worker
CMD ["npx", "ts-node", "src/index.ts"]
