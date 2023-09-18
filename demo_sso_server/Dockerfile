FROM node:20

# Create app directory
WORKDIR /app

COPY package*.json ./

# Install app dependencies
RUN npm install
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD [ "npm", "start" ]