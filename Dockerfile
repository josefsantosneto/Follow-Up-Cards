FROM node:18-alpine

WORKDIR /app

#chown -R change the owner of app folder to app

COPY package*.json ./
RUN npm install 
COPY . .

# RUN npm build --prefix client

USER node 

CMD ["npm", "start","node","app.js"]

EXPOSE 8000