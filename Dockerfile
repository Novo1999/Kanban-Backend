FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json /usr/src/app

RUN npm install

COPY . .

EXPOSE 6300
CMD [ "npm", "start" ]