# V — Build, release, run: dependency install (build) vs runtime (release)

FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:18-alpine AS release
WORKDIR /app

ENV NODE_ENV=production
ENV SKIP_DOTENV=1

COPY package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 \
  && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const req=require('http').get('http://127.0.0.1:3000/health',(res)=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));"

CMD ["node", "src/server.js"]
