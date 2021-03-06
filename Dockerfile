FROM node:14-alpine

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 8000

CMD [ "node", "index.js" ]