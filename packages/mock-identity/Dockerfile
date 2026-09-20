FROM node:20-alpine
# Build context is the monorepo root so scripts/ is accessible
WORKDIR /app
COPY packages/mock-identity/package.json ./package.json
RUN npm install
COPY packages/mock-identity/src ./src
COPY scripts ./scripts
EXPOSE 4001
CMD ["node", "src/index.js"]
