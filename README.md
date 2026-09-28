We Talk: Real-Time Chat Application

A full-stack, real-time chat app with multiple rooms, live presence, typing indicators and JWT authentication. Built with the MERN stack, Socket.io and Redis.

Live demo: https://realtime-chat-app-2k3i.onrender.com

Features
Sign up and log in with JWT authentication and bcrypt-hashed passwords
Real-time messaging across multiple chat rooms using Socket.io
Live presence: see who is online in the room
Typing indicators ("X is typing...")
Message history stored in MongoDB and loaded when you join a room
Permanent #general room, plus temporary rooms you can create by typing a new name. A temporary room and its messages are deleted 30 seconds after the last person leaves
Auto-scroll and timestamps on every message
Stays logged in after a refresh, and returns you to the room you were in

Tech Stack
Layer	Technology
Frontend:	React (Vite), plain CSS
Backend:	Node.js, Express.js
Real-time	Socket.io with the Redis adapter
Database:	MongoDB (Mongoose)
Cache / scaling	Redis (Upstash)
Auth	JWT, bcryptjs

How It Works
The server checks the user's JWT when a socket connects, and takes the username from the token, never from what the browser sends. Nobody can pretend to be someone else.
Messages are validated on the server (must be text, inside the room the user joined, at most 1000 characters) before they are saved and broadcast.
The Redis adapter shares Socket.io events between server instances, so the app can scale to more than one server. The online list uses fetchSockets(), which works across instances.
Temporary rooms are cleaned up by a short timer. A startup check also clears leftover rooms if the server restarts.

Run It Locally

You need Node.js, a MongoDB connection string (a free MongoDB Atlas cluster works) and a Redis URL (a free Upstash database works).

1. Clone the repo

bash
git clone https://github.com/Keyur2024/realtime-chat-app.git
cd realtime-chat-app

2. Start the server

bash
cd server
npm install

Create a file called .env inside server/, using .env.example as a guide:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
REDIS_URL=your_redis_url
CLIENT_URL=http://localhost:5173
PORT=5000

Then start it:

bash
node index.js

3. Start the client (in a second terminal)

bash
cd client
npm install
npm run dev

Open http://localhost:5173. The client talks to http://localhost:5000 by default. To point it somewhere else, set VITE_API_URL in a client/.env file.

What I Would Improve Next
Rate limiting on login and messages
Private one-to-one messages
Store the login token in an httpOnly cookie instead of localStorage
