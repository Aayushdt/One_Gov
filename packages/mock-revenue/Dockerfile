FROM node:20-alpine
# Build context is the monorepo root so scripts/ is accessible
WORKDIR /app
COPY packages/mock-revenue/package.json ./package.json
RUN npm install
COPY packages/mock-revenue/src ./src
COPY scripts ./scripts
EXPOSE 4003
CMD ["node", "src/index.js"]
