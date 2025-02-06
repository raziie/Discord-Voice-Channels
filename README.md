# Discord Voice Channels

This project is a self-hosted implementation of Discord-like voice channels. Follow the steps below to set up and run the application on your local network.

## Prerequisites

- Both devices (server and client) must be connected to the **same network**.
- Ensure **proxy and firewall** are disabled for smooth connectivity.
- Docker installed on your system.
- MongoDB installed or available via Docker.

## Installation and Setup

### Step 1: Get Your Local IP Address

Run the following command in the terminal to find your local IP address:

```sh
ipconfig # (Windows)
ifconfig # (Mac/Linux)
```

Replace the IP in `const socket = io("https://192.168.1.52:5000");` inside `voicechannel` with your local IP.

### Step 2: Start MongoDB

If you have MongoDB installed locally, start it using:

```sh
mongod
```

### Step 3: Running with Docker

Navigate to the project directory and build the Docker container:

```sh
docker-compose up --build
```

If the container is already built, simply run:

```sh
docker-compose up
```

### Step 4: Running Without Docker

If you prefer to run the application without Docker, follow these steps:

#### Start the Backend

```sh
cd backend
nodemon server.js
```

#### Start the Frontend

```sh
cd frontend
npm start
```

### Step 5: Access the Application

Once the server is up and running, access the application at:

```
https://192.168.1.52:3000/
```

Make sure the IP matches your local network configuration.

## Repository

For the latest updates and source code, visit the GitHub repository:

[Discord Voice Channels - GitHub](https://github.com/raziie/Discord-Voice-Channels)

---

### Notes:
- If the application fails to connect, ensure that MongoDB is running.
- If Docker is not available, you may need to manually run the backend and frontend.
- Ensure all dependencies are installed before running the application.

Enjoy your self-hosted voice channels! 🎙️

Images:

![Screenshot 2025-02-06 074140](https://github.com/user-attachments/assets/8f331f10-2841-4395-a3e0-3a2a4dc4297d)

![5846001526026390762](https://github.com/user-attachments/assets/e91c3c32-cc01-4274-bd9a-764c1a00bb37)



