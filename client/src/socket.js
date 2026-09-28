import { io } from "socket.io-client";
import { API_URL } from "./config";

const socket = io(API_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem("token") }),
});

export default socket;
