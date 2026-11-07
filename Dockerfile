FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_APPLY_SCRIPT_URL
ENV VITE_APPLY_SCRIPT_URL=$VITE_APPLY_SCRIPT_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/voice-proxy.ts ./voice-proxy.ts
EXPOSE 8080
CMD ["node", "--experimental-strip-types", "server/start.ts"]
