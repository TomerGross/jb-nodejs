FROM node:16.13.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev && rm -rf root/.cache/*

# Copy the application code to the container
COPY . .

# Expose the port on which your application listens
EXPOSE 3000

# Start the application
CMD npm run start

