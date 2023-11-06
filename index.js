const app = require("express")();
const path = require('path');
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());

const PORT = process?.env?.PORT || 8000;

app.get('*', (req, res) => {
	res.sendFile(
        path.join(__dirname, "./client/build/index.html")
      );
});

const users=[]

io.on("connection", (socket) => {
	//My ID
	socket.emit("me", socket.id);

	socket.on("registerUser", (name) => {
		//Creation of a new user
		const user = {
		  id: socket.id,
		  name,
		};
		//Update user list and check if the socket id is present without a name. 
		//Update the name if ID present
		var index = users.findIndex(element => element.id === user.id);
		if (index > -1) {
		users[index] = user;
		} else {
		users.push(user);
		}
		console.log('Users',users)
		//Emit the updated user list to show all users.
		io.emit("updateUserList", users);
	  });

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	});

	socket.on("callUser", (data) => {
		//Send a signal to the user being called.
		io.to(data.userToCall).emit("callUser", 
		{ signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		//Send a signal from the user who answered the call.
		io.to(data.to).emit("callAccepted", data.signal)
	});
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));