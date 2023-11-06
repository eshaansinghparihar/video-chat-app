import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import io from "socket.io-client"
import "./App.css"


const socket = io.connect('http://localhost:8000')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
  const [ showApp, setShowApp]=useState(false)
  const [ users, setUsers] = useState([]);
  const [ selectedUser, setSelectedUser] = useState(null);
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		showApp && navigator.mediaDevices
    .getUserMedia({ video: showApp, audio: false })
    .then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})
  
  socket.on("updateUserList", (updatedUsers) => {
    setUsers(updatedUsers);
    console.log(users)
  });  

	socket.on("me", (id) => {
      console.log('Me',id) 
			setMe(id)
		})

  socket.on("callUser", (data) => {
    console.log('Call From User', data)
    setReceivingCall(true)
    setCaller(data.from)
    setName(data.name)
    setCallerSignal(data.signal)
  })
	}, [showApp])

  useEffect(()=>{
    socket.emit("registerUser", name);
  },[name])

	const callUser = (idToCall) => {
		const peer = new window.SimplePeer({
			initiator: true,
			trickle: false,
			stream: stream
		})

		peer.on("signal", (signalData) => {
      console.log('Signal Data',signalData)
			socket.emit("callUser", {
				userToCall: idToCall,
				signalData: signalData,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
				userVideo.current.srcObject = stream
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new window.SimplePeer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (signal) => {
			socket.emit("answerCall", 
      { signal: signal, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

  const handleNameChange=(e)=>{
    setName(e.target.value)
  }

  const proceed=()=>{
    if(name)
    setShowApp(true)
    else
    console.error('Input name.') 
  }

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIdToCall(user.id)
  };

	return (
		<>
		<h1 style={{ textAlign: "center", color: '#fff' }}>Video Chat App</h1>
    {showApp ? 
    //Call page
      <>
      <div className="container">
        <div className="video-container">
          <div>
            {stream &&  <video className="myVideo" playsInline muted ref={myVideo} autoPlay />}
          </div>
          <div>
            {callAccepted && !callEnded ?
            <video className="participantVideo" playsInline ref={userVideo} autoPlay/> :
            null}
          </div>
        </div>
        <div className="myId">
        <h2>Online Users</h2>
        <ul className="users">
          {users.filter((user)=>user.name!=='' && user.id!==me).map((user) => (
            <button className="user" key={user.id} onClick={() => handleUserClick(user)}>
              { user.name }
            </button>
          ))}
        </ul>
          <div className="call-button">
            {callAccepted && !callEnded ? (
              <Button variant="contained" color="secondary" onClick={()=> leaveCall()}>
                End Call
              </Button>
            ) : (
              <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
                <PhoneIcon fontSize="large" />
              </IconButton>
            )}
            {selectedUser && selectedUser.name}
          </div>
        </div>
      </div>
      <div>
        {receivingCall && !callAccepted ? (
            <div className="caller">
            <h1 >{name} is calling...</h1>
            <Button variant="contained" color="primary" onClick={()=> answerCall()}>
              Answer
            </Button>
          </div>
        ) : null}
      </div>
      </>:
    //Login Page
      <>
        <div className="name">
        <input
            placeholder="Please enter your name to proceed"
            value={name}
            onChange={handleNameChange}
          />
        <button
        className="proceedBtn"
        onClick={()=>proceed()}
        >
          Proceed
        </button>
        </div>
      </>
      }
		</>
	)
}

export default App
