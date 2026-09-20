FROM node:20-alpine
# Build context is the monorepo root so scripts/ is accessible
WORKDIR /app
COPY packages/mock-education/package.json ./package.json
RUN npm install
COPY packages/mock-education/src ./src
COPY scripts ./scripts
EXPOSE 4002
CMD ["node", "src/index.js"]
