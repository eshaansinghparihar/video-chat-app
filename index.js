const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());

const PORT = process.env.PORT || 8000;

app.get('*', (req, res) => {
	res.sendFile(
        path.join(__dirname, "./client/build/index.html")
      );
});

const users=[]

io.on("connection", (socket) => {

	socket.emit("me", socket.id);

	socket.on("registerUser", (name) => {
		const user = {
		  id: socket.id,
		  name,
		};
		users.push(user);
		io.emit("updateUserList", users);
	  });

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	});

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	});
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));