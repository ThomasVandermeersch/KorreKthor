FROM node:14
WORKDIR /usr/src/korrekthor_backend/
COPY package*.json ./
RUN npm install
RUN npm install -g pm2
RUN npm install -g sequelize-cli
COPY . .
RUn sequelize db:create
RUN sequelize db:migrate
EXPOSE 9898
CMD [ "npm", "run", "prod" ]
