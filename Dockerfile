FROM node:12
WORKDIR /usr/src/efuse
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "src/index.js"]