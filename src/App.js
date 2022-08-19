import React, { FC, useState, useEffect, useCallback } from "react";
import "./App.css";
import { useMoralis } from "react-moralis";
import Moralis from "moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loading, Table } from "@web3uikit/core";
import { Container, Row, Col, Button, Form, Modal } from "react-bootstrap";
import {utils, web3} from "@project-serum/anchor";
import WidgetBot from "@widgetbot/react-embed";
import {  Routes, Route, useParams, useNavigate } from "react-router-dom";

import RoomAmount from "./components/createRoom";
import PrivateRoom from "./components/privateRoom"
import { FiRefreshCcw } from "react-icons/fi";

import MyNavbar from './components/web3signin';


const App = () => {
  const [username, setUser] = useState("");
  const { isAuthenticated, authenticate, isAuthenticating } = useMoralis();
  const { connected, publicKey } = useWallet();
  const [sound, setSound] = useState(true);
  const navigate = useNavigate();


  const wrapperSetParentState = useCallback(val => {
    setSound(val);
  }, [setSound]);
  

  function CreateRoomModal(props) {
    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Create a room
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RoomAmount pda={props.pda} owner={props.owner} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const fetchCurrentUser = () => {
    const currentUser = Moralis.User.current();
    if (currentUser) {
      setUser(currentUser.getUsername());
    }
  };



  const getHelloFromCloud = async () => {
    const params = { text: "from belgium!" };
    const hello = await Moralis.Cloud.run("helloword", params); //runs a function on the cloud
  };

  const DiscordChat = () => {
    return (
      <Col className="discordChat">
        <Container className="discord_chat_container">
          <WidgetBot
            server="728233239998627842"
            channel="728250903689166909"
            height={500}
          />
        </Container>
      </Col>
    );
  }

  const MainContainer = () => {
    const [modalShow, setModalShow] = useState(false);
    const [rooms, setRooms] = useState([]);

    const fetchRooms = async () => {
      const rooms = await Moralis.Cloud.run("getRooms", {});
      if (rooms) {
        setRooms(rooms);
      }
    };
  
    const joinRoom = async (event) => {
      const user = Moralis.User.current();
      const challenger = user.getUsername();
      const solAddress = user.get("solAddress");
      const id = event.target.id;
      const params = { roomId: id, challenger: challenger, solAddress: solAddress, userID: user.id };
      const busy = await Moralis.Cloud.run("joinRoom", params)
      if (!busy){
        user.set("is_playing", true)
        user.set("in_room", id)
        await user.save();
        navigateToRoom(id)
      }
      else alert("room is already full")
    };
  
    const navigateToRoom = (roomId) => {
      // 👇️ navigate to /
      navigate(`/rooms/${roomId}`);
    };

    useEffect(() => {
      Moralis.start({
        appId: "q68VhoY1OrgY8surAySXfmqvxaCEDuxcUdDO7zia",
        serverUrl: "https://ro9hwec6hamv.usemoralis.com:2053/server"
      })
    }, [])

    useEffect(() => {
      if (isAuthenticated) {
        fetchCurrentUser();
        fetchRooms();
      }
    }, [isAuthenticated]);
  
    useEffect(() => {
      if (isAuthenticated && connected){
        //if user was playing redirect user to his room
      const currentUser = Moralis.User.current();
      if (currentUser.get("is_playing")) {
        const aRoom = currentUser.get("in_room");
        if (aRoom) {
          navigateToRoom(currentUser.get("in_room"));
        }
      }
      }
    }, [isAuthenticated, connected]);

    return (
      <Col className="roomList" xs={6}>
      <Container>
        <Row>
          <Container>
            <Button onClick={() => setModalShow(true)}>Create Room</Button>
          </Container>
          <CreateRoomModal
            show={modalShow}
            onHide={() => setModalShow(false)}
            owner={publicKey}
          />
        </Row>
        <Row>
          <Col>
            <Form>
              <Form.Group
                className="mb-3"
                controlId="exampleForm.ControlInput1"
              >
                <Form.Control type="text" placeholder="Search..." />
              </Form.Group>
            </Form>
          </Col>
          <Col>
            <h5></h5>
          </Col>
          <Col>
            <h5></h5>
          </Col>
          <Container>
          <Table
            columnsConfig="40px 3fr 2fr 2fr 80px"
            data={
              rooms != null
                ? [
                    rooms.flatMap((room) => {
                      const playing = room.get("playing");
                      const chall = room.get("challenger");
                      const roomId = room.id;
                      const status = () => {
                        if (playing && chall !== "null") return chall;
                        else return "Waiting";
                      };
                      const joinStatus = () => {
                        if (playing && chall !== "null") return <Button disabled id={roomId} onClick={joinRoom}>
                        Join
                      </Button>;
                        else return <Button id={roomId} onClick={joinRoom}>
                        Join
                      </Button>;
                      };
                      return [
                        null,
                        room.get("owner"),
                        room.get("bet_amount"),
                        status(),
                        joinStatus(),
                      ];
                    }),
                  ]
                : []
            }
            header={[
              "",
              <span><h5>Host</h5></span>,
              <span><h5>Bet</h5></span>,
              <span><h5>Challenger</h5></span>,
              <span>
                <Button onClick={fetchRooms}>
                  <FiRefreshCcw />
                </Button>
              </span>,
            ]}
            isColumnSortable={[false, true, false, false, false]}
            maxPages={3}
            onPageNumberChanged={function noRefCheck() {}}
            onRowClick={function noRefCheck() {}}
            pageSize={5}
          />
          </Container>
          
        </Row>
      </Container>
    </Col>
    )
  }

  useEffect(() => {
    if (isAuthenticated) {
     // enterRoomPing();
     // leaveRoomPing()
    }

  }, [isAuthenticated])

  const Home = () => {
    return (
      <Container>
        <h1 className="room_name">Dashboard of {username}</h1>
        <Row>
          <DiscordChat/>
          <MainContainer/>
          <Col className="leaderboard">
            <h3>Leaderboard</h3>
            <Container>
              <Table
                columnsConfig="100px 3fr 1fr 10px"
                data={[
                  [1, "Sengo", 30],
                  [2, "Zmk.SOL", 20],
                  [3, "Snghbeer", 15],
                ]}
                header={[
                  <span>Rank</span>,
                  <span>Player</span>,
                  <span>Wins</span>,
                  "",
                ]}
                isColumnSortable={[false, false, true]}
                noPagination
                //isLoading
                onPageNumberChanged={function noRefCheck() {}}
                onRowClick={function noRefCheck() {}}
                pageSize={10}
              />
            </Container>
          </Col>
        </Row>
      </Container>
    );
  };

  if (isAuthenticated && connected) {

    return (
    
        <div>
          <MyNavbar sound={sound} setSound={wrapperSetParentState}/>
          <Routes>
          <Route path="/" index element={<Home />}/>
          <Route path="/rooms/:userId" element={<PrivateRoom soundState={sound}/>} />

        </Routes>
        </div>
    );
  } else if (isAuthenticating) {
    return (
      <div>
          <MyNavbar sound={sound} setSound={wrapperSetParentState}/>
        <Container>
        <Loading spinnerColor="#2E7DAF" text="Fetching Data..." />
      </Container>
      </div>
    );
  }
  else{
    return(
      <div>
         <MyNavbar sound={sound} setSound={wrapperSetParentState}/>
        <Container>
        <h1 className="room_name">Welcome to Asaka Games</h1>
        <h3>Please log-in to continue</h3>
    </Container>
      </div>
    )
  }
};

export default App;
