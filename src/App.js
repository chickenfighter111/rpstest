import React, { FC, useState, useEffect, useCallback } from "react";
import "./App.css";
import { useMoralis } from "react-moralis";
import Moralis from "moralis";
import { useWallet } from "@solana/wallet-adapter-react";

import { Keypair, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

import { Loading } from "@web3uikit/core";
import { Container, Row, Col, Button, Form, Modal, Table as RTable } from "react-bootstrap";
import {utils, web3} from "@project-serum/anchor";
import WidgetBot from "@widgetbot/react-embed";
import {  Routes, Route, useParams, useNavigate, Link } from "react-router-dom";

import RoomAmount from "./components/createRoom";
import PrivateRoom from "./components/privateRoom"
import { FiRefreshCcw } from "react-icons/fi";
import  {FaDiscord} from 'react-icons/fa'

import sol from "./components/media/solc.png"

import me from "./components/media/ME.png";
import twt from "./components/media/twitter.png";
import styled from "styled-components"

const StyledBtn = styled(Button)`
  max-width: 150px;
  max-height: 45px;
  font-size: 20px;
`

const utf8 = utils.bytes.utf8;

const App = (props) => {
  const [username, setUser] = useState("");
  const { isAuthenticated, authenticate, isAuthenticating } = useMoralis();
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();


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
  
  const MainContainer = () => {
    const [modalShow, setModalShow] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchRoom, setSetSearchRoom] = useState("");

    const fetchRooms = async () => {
      const rooms = await Moralis.Cloud.run("getRooms", {});
      if (rooms) {
        setRooms(rooms);
      }
    };

    const userLeaderBoard = async () => {
      const topPlayers = await Moralis.Cloud.run("getLeaderBoard", {});
      if (topPlayers) {
        setUsers(topPlayers);
      }
    };

    const onSearchHandle = async(astring) =>{
      const itContains = (a_string, some_string) =>{
        return (a_string.toLowerCase().startsWith(some_string.toLowerCase()))
      }

      if (astring === "") fetchRooms()
      else {
        setRooms(rooms.filter(aRoom => itContains(aRoom.get("room_name"), astring)))
      }
    }

    const handleInput = async (event) => {
      setSetSearchRoom(event.target.value);
      onSearchHandle( event.target.value)
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
      // ??????? navigate to /
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
        userLeaderBoard();
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
      <Col className="roomList" lg={9}>
      <Container>
        <Row>
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
                <Form.Control type="text" placeholder="Search..." value={searchRoom} onChange={handleInput}/>
              </Form.Group>
            </Form>
          </Col>
          <Col>
            <h5></h5>
          </Col>
          <Col>
            <h5></h5>
          </Col>
          <Container className={props.darkmode ? "myTable-dark" : "myTable"}>
            <RTable responsive borderless className={props.darkmode ? "darkTable" : null}>
              <thead>
                <tr>
                  <th><Button onClick={fetchRooms}>
                      <FiRefreshCcw />
                    </Button></th>
                  <th colSpan={5}><h5>Room name</h5></th>
                  <th ><h5>Bet</h5></th>
                  <th  colSpan={2}><h5>Challenger</h5></th>
                  <th >
                  <Container>
                    <StyledBtn onClick={() => setModalShow(true)}>Create Room</StyledBtn>
                  </Container>
                  </th>
                </tr>
              </thead>
              <tbody> 
                  {
                    rooms.flatMap((room, idx) => {
                                  const playing = room.get("playing");
                                  const chall = room.get("challenger");
                                  const roomId = room.id;
                                  const status = () => {
                                    if (chall !== "null") return (chall.substring(0,15));
                                    else return "Waiting";
                                  };
                                  const joinStatus = () => {
                                    if (playing || chall !== "null") return <StyledBtn disabled id={roomId} onClick={joinRoom}>
                                    Join
                                  </StyledBtn>;
                                    else return <Button id={roomId} onClick={joinRoom}>
                                    Join
                                  </Button>;
                                  };
                                  return (
                                    <tr key={idx}>
                                    <td>{null}</td>
                                    <td colSpan={5}>{room.get("room_name").substring(0,15)}</td>
                                    <td className="testSpan"> 
                                      <td className="amountSpan"><span>{room.get("bet_amount")}</span> </td>
                                      <td className="logoSpan"><img src={sol} width={30} height={25} alt="SOL"/></td>
                                    </td>
                                    <td>{status()}</td>
                                    <td colSpan={2}>{joinStatus()}</td>
                                    </tr>
                                  )})
                  }
              </tbody>
            </RTable>
          </Container>
          
        </Row>
      </Container>
    </Col>
    )
  }

  const LeaderBoardContainer = () => {
    const [users, setUsers] = useState([]);


    const userLeaderBoard = async () => {
      const topPlayers = await Moralis.Cloud.run("getLeaderBoard", {});
      if (topPlayers) {
        setUsers(topPlayers);
      }
    };


    useEffect(() => {
      if (isAuthenticated) {
        userLeaderBoard();
      }
    }, [isAuthenticated]);

    return (
      <RTable responsive borderless>
      <thead>
        <tr>
          <th><h5>Rank</h5></th>
          <th colSpan={2}><h5>Username</h5></th>
          <th><h5>Wins</h5></th>
        </tr>
      </thead>
      <tbody>
        {users ? (
          users.map((aUser, index) => {
            return(
              <tr key={index}>
                <td>{index + 1}</td>
                <td colSpan={2}>{aUser.username.substring(0,15)}</td>
                <td>{aUser.wins}</td>
              </tr>
            )
          })
        ) : 
        (<Loading spinnerColor="#2E7DAF" text="Fetching Data..." />)
      }
      </tbody>
    </RTable>
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
      <Container className="roomContainer">
        <h1 className="dashboardName">Dashboard of {username}</h1>
        <Row>
          <MainContainer/>
          <Col className="leaderboard">
            <h2 className="aTitle">Season ranking</h2>
            <Container >
              <Row>
                <div className={`leaderboardContainer ${props.darkmode ? "leaderBoardTable-dark" : "leaderBoardTable"}`}
                >
                  <LeaderBoardContainer/>
                </div>
              </Row>
              <Row>
                <Col>
                  <a target="_blank" href='https://discord.gg/VufJp2EY' ><FaDiscord className="disca" size={60} fill={props.darkmode ? "#FFD966" : "#5b34eb"}/></a>
                </Col>
                <Col>
                  <a target="blank" href="https://magiceden.io/marketplace/asakalabsnft"><img width={50} height={50} src={me}></img></a>
                </Col>
                <Col>
                  <a target="_blank"  href='https://twitter.com/AsakaLabs' ><img width={50} height={50} src={twt} alt="discord"></img></a>
                </Col>
            </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    );
  };

  if (isAuthenticated && connected) {

    return (
      <div>
        <Routes>
          <Route path="/" index element={<Home />} />
          <Route
            path="/rooms/:userId"
            element={
              <PrivateRoom
                darkmode={props.darkmode}
                onChangeBalance={props.onChangeBalance}
                bal={props.bal}
                dbalance={props.dbalance}
                donChangeBalance={props.donChangeBalance}
                fbalance={props.fbalance}
                fonChangeBalance={props.fonChangeBalance}
                soundState={props.soundState}
              />
            }
          />
        </Routes>
      </div>
    );
  } else if (isAuthenticating) {
    return (
      <div>
        <Container>
        <Loading spinnerColor="#2E7DAF" text="Fetching Data..." />
      </Container>
      </div>
    );
  }
  else{
    return(
      <div>
        <Container className="welcomeContainer">
        <h1 className="room_name">Welcome to Asaka Games</h1>
        <h3>Please log-in to continue</h3>
       </Container>
      </div>
    )
  }
};

export default App;
