FROM node:20-alpine

WORKDIR /app

COPY package*.json .
RUN npm install -g npm@10 && npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]