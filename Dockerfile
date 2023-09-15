FROM node:20

# Create app directory
WORKDIR /app

COPY package*.json ./

# Install app dependencies
RUN npm install
RUN npm ci --omit=dev

COPY . .

RUN rm /app/CreateDB.sql /app/Dockerfile.postgreSQL

EXPOSE 3000

CMD [ "npm", "start" ]