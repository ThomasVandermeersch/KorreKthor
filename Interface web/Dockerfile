FROM node:14
WORKDIR /usr/src/korrekthor_backend/
COPY package*.json ./
RUN npm install \
    && npm install -g pm2 \
    && npm install -g sequelize-cli \
    && npm cache clean --force
COPY . .
#RUN sequelize db:migrate
EXPOSE 9898
CMD [ "npm", "run", "prod" ]
