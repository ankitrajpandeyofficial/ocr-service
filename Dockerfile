FROM node:22-bookworm-slim

# Install tesseract
RUN apt-get update && \
    apt-get install -y --no-install-recommends tesseract-ocr && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]
