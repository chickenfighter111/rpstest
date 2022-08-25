import {
  Container,
  Button,
  Row,
  Col,
  DropdownButton,
  Dropdown,
  Modal,
  Table as RTable
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import Moralis from "moralis";
import { useMoralis } from "react-moralis";

import React,{ useEffect, useState, useMemo, useReducer } from "react";
import Chat from "./roomchat";
import { Loading, Table, Card, Tag } from "@web3uikit/core";
import Countdown from "react-countdown";
import DiscordChat from './discordChat'

import rock from "./media/cards/rock.png";
import paper from "./media/cards/paper.png";
import scissor from "./media/cards/scissor.png";
import none from "./media/cards/unkown.PNG";
import sol from "./media/sol.png";
import logo from "./media/cards/card2.png";
import deck from "./media/cards/deck_final.png";
import me from "./media/ME.png";
import twt from "./media/twitter.png";
import dsc from "./media/discord.png";

import r1 from "./media/results/r1.png";
import r2 from "./media/results/r2.png";
import r3 from "./media/results/r3.png";
import r4 from "./media/results/r4.jpg";

import AOS from "aos";

import "aos/dist/aos.css";

import {AiFillEye, AiFillSound, AiOutlineSound} from 'react-icons/ai'
import  {FaVolumeUp} from 'react-icons/fa'
import  {BiVolumeMute} from 'react-icons/bi'
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  AnchorProvider,
  Program,
  utils,
  web3,
  BN, Wallet
} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";

import useSound from 'use-sound';
import winnerSound from './media/results/winner.mp3'; 
import loser from './media/results/loser.mp3'; 
import tie from './media/results/tie.mp3'; 
import countdownSound from './media/7s.wav'; 
import hg from './media/hourglass.gif'
import Buffer from 'buffer'
import styled from "styled-components"
import { User } from "@web3uikit/icons";

const StyledModal = styled(Modal)`
 div{
  div{
    background-color: #FFD966;
    border-radius: 25px;
  }
 }
`

const StartBtn = styled(Button)`
  width: 150px;
  height: 45px;
  font-size: 35px;
`

const network = "https://devnet.genesysgo.net/"; //devnet

const imgs = [rock, paper, scissor]
const Hands = {
  rock: "0",
  paper: "1",
  scissor: "2",
  none: "3",
}


const resultMessages = [
  {
    msg: "You win ",
    img: r2,
    leaveMsg: "Leave with shame",
  },
  {
    msg: "You got beat ",
    img: r4,
    leaveMsg: "Leave with shame",
  },
  {
    msg: "Draw?!",
    img: r1,
    leaveMsg: "Leave with shame",
  },
  {
    msg: "Insufficient funds...",
    img: r3,
    leaveMsg: "Close",
  }
];


const fee_wallet = new anchor.web3.PublicKey(
  "4mkNvUq24DN9g8EWuJWkc176t9PiRnRU4d3U8WuZ1TC1"
);
const one_sol = 1_000_000_000;

const Rooms = (props) => {
  const params = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useMoralis();

  const [smShow, setSmShow] = useState(false);

  const [roomName, setRoomName] = useState("");
  const [mode, setMode] = useState(false);
  const [selectedBox, setBox] = useState(null);

  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [gameStarted, setStarted] = useState(false);
  const [amount, setAmount] = useState(0);

  const [selectedHand, setHand] = useState(Hands.none);
  const [selectedChoice, setChoice] = useState(none);
  const [revealedCards, setrevealedCards] = useState(new Set());
  const [chosenCards, setchosenCards] = useState(new Set());
  const [choices, setChoices] = useState([null, null, null, null, null]);
  const [cards, setCards] = useState([logo, logo, logo, logo, logo]);
  const [opCards, setOpCards] = useState([logo, logo, logo, logo, logo]);
  const [opponentChoice, setOppenentChoice] = useState(none);
  const [generatedhands, setGenHands] = useState(null);


  const [choiceConfirmed, setConfirmed] = useState(false);
  const [readyState, setReadtState] = useState(false)
  const [duelEnded, setEndedDuel] = useState(false);
  const [canPay, setCanPay] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isWinner, setIsWinner] = useState(false)
  const [roomPDA, setRoomPda] = useState(null);

  const [user, setUser] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [totalSelected, setTotalSel] = useState(0);
  const [owner, setOwner] = useState(false)

  const [chosenOnes, setChoseOnes] = useState([]);
  const [opChosenOnes, setOpChoseOnes] = useState([]);

  const [soundState, setSoundState] = useState(true)
  const [winSound] = useSound(winnerSound);
  const [loseSound] = useSound(loser);
  const [tieSound] = useSound(tie);
  const [ctdwnSound] = useSound(countdownSound);
  const [announcements, setAnnouncements] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [noFunds, setNoFunds] = useState(false);
  const [selectEnded, setSelectEnded] = useState(false)
  const [betProcessing, setBetProcess] = useState(false)


  const idl = require("../rps_project.json");
  const idl2 = require("../rps_signer.json");
  const utf8 = utils.bytes.utf8;

  const { wallet, publicKey, signTransaction, signAllTransactions, connected } =
    useWallet();
  const anchorWallet = useMemo(() => {
    if (!wallet || !publicKey || !signTransaction || !signAllTransactions) {
      return;
    }
    return {
      publicKey: publicKey,
      signAllTransactions: signAllTransactions,
      signTransaction: signTransaction,
    };
  }, [wallet]);
  const one_sol = 1_000_000_000;

  const connection = new web3.Connection(network, "finalized");
  const provider = new AnchorProvider(connection, anchorWallet, {preflightCommitment: "finalized"});
  const program = new Program(idl, idl.metadata.address, provider);


  const navigateToDashboard = () => {
    navigate(`/`);
  };

  const leaveRoom = async (anid) => {
    const user = Moralis.User.current().getUsername();
    const id = anid;
    const params = { roomId: id, player: user };
    const canLeave = await Moralis.Cloud.run(
      "leaveRoom",
      params
    );
    if (canLeave && !gameStarted) {
      Moralis.User.current().set("is_playing", false);
      Moralis.User.current().set("in_room", null);
      await Moralis.User.current().save();
      navigateToDashboard();
    }
  };

  const getRoomData = async (id) => {
    const params = { roomId: id };
    const roomData = await Moralis.Cloud.run("getRoomData", params); //runs a function on the cloud
    const username = Moralis.User.current().getUsername();
    const chat = roomData.get("chat");
    setRoomName(roomData.get("room_name"));
    setChatId(chat.id);
    setRoomPda(roomData.get("room_address"))
    setAmount(roomData.get("bet_amount"));
    if (roomData.get("challenger") !== "null") {
      if (username === roomData.get("owner"))
        setOpponent(roomData.get("challenger").substring(0,15));
      else setOpponent(roomData.get("owner").substring(0,15));
    }
  };

  const canPlay = async () => {
    const [escrowPda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('a_player_escrow_wallet'), publicKey.toBuffer()],
      program.programId
    );
    const balance = await provider.connection.getBalance(escrowPda); //player escrow
    const roundedBalance = Math.round((balance / one_sol)  * 100) / 100
    if (roundedBalance > amount) return true
    else return false
  }

  const setOpponentsChoice = async (index) => {
    switch (index) {
      case "0":
        setOppenentChoice(rock);
        break;
      case "1":
        setOppenentChoice(paper);
        break;
      case "2":
        setOppenentChoice(scissor);
        break;
      default:
        break;
    }
  };

  const selectChoice = async (index) => {
    if (mode) {
      switch (index) {
        case "0":
          setChoice(rock);
          setHand(Hands.rock);
          break;
        case "1":
          setChoice(paper);
          setHand(Hands.paper);
          break;
        case "2":
          setChoice(scissor);
          setHand(Hands.scissor);
          break;
        default:
          break;
      }
    } else {
      switch (index) {
        case "0":
          cards[selectedBox] = rock;
          choices[selectedBox] = Hands.rock;
          break;
        case "1":
          cards[selectedBox] = paper;
          choices[selectedBox] = Hands.paper;
          break;
        case "2":
          cards[selectedBox] = scissor;
          choices[selectedBox] = Hands.scissor;
          break;
        default:
          break;
      }
    }
  };

  const notAllSelected = () => {
    let res = false
    cards.forEach((aCard) => {
      if (aCard !== logo){
        res = true
      }
    })
    return res
  }

  const selectCard = async() =>{
    if (chosenCards.size < 3){
      chosenCards.add(selectedBox)
      setTotalSel(totalSelected + 1)
      chosenOnes.push(generatedhands[selectedBox])
    }
  }

  //1
  const selectHand = async (event) => {
    const achoice = event.target.id;
    selectChoice(achoice);
    if (notAllSelected()){
      setTotalSel(totalSelected + 1);
    }
  };

  //2
  const sendSelectedHand = async () => {
    if (choiceConfirmed) {
      if (mode) {
        const challenger = Moralis.User.current().id;
        const roomID = roomId;
        const playerData = { player: challenger, choice: selectedHand };
        const params = { room: roomID, playerData: playerData };
        await Moralis.Cloud.run("ready", params); //runs a function on the cloud
      } else {
        const challenger = Moralis.User.current().id;
        const roomID = roomId;
        const playerData = { player: challenger, choice: chosenOnes };
        const params = { room: roomID, playerData: playerData };
        await Moralis.Cloud.run("ready2", params); //runs a function on the cloud
      }
    }
  };

  //3 + should sign transaction and check for validated signature
  const start = async () => {
    //sign transaction & send hands to DB
    if (gameStarted) {
      const challenger = Moralis.User.current().id;

      //after countdown started
      //evaluates at server side the winner
      if (mode) {
        const params = { room: roomId, playerData: challenger };
        await Moralis.Cloud.run("start", params); //runs a function on the cloud
      } else {
        const params = { room: roomId, playerData: challenger };
        await Moralis.Cloud.run("start2", params); //runs a function on the cloud
      }
    }
  };

  const startRound = async () => {
    //sign transaction & send hands to DB
    if (await canPlay()){
      const params = { room: roomId };
      await Moralis.Cloud.run("startRound", params); //runs a function on the cloud
    }
    else setNoFunds(true)
  };

  const evaluateWinnerInUI = () => {
    let results = [null, null, null];
    for(let i = 0; i < chosenOnes.length; i++){
      switch (chosenOnes[i]) {
        case Hands.rock: 
          switch (opChosenOnes[i]) {
            case Hands.rock:
              results[i] = [1,1]
              break;
            case Hands.paper:
              results[i] = [0,1]
              break;
            case Hands.scissor:
              results[i] = [1,0]
              break;
            default:
              results[i] = [1,0]
              break;
          };
          break;
        
        case Hands.paper: 
          switch (opChosenOnes[i]) {
            case Hands.rock:
              results[i] = [1,0]
              break;
            case Hands.paper:
              results[i] = [1,1]
               break;
            case Hands.scissor:
              results[i] = [0,1]
              break;
            default:
              results[i] = [1,0]
              break;
          };
          break;
        
        case Hands.scissor: 
          switch (opChosenOnes[i]) {
            case Hands.rock:
              results[i] = [0,1]
              break;
            case Hands.paper:
              results[i] = [1,0]
              break;
            case Hands.scissor:
              results[i] = [1,1]
              break;
            default:
              results[i] = [1,0]
              break;
          };
          break;
        default:
          results[i] = [0,1]
          break;
      }
    }
    return results
  }

  function ShowResultsModal(props) {
    let res;
    let p1_score = 0;
    let p2_score = 0;
    if (opChosenOnes){
      res = evaluateWinnerInUI();
      p1_score = res.filter(aDuel => aDuel[0] === 1).length;
      p2_score = res.filter(aDuel => aDuel[1] === 1).length;
    }

    return (  
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
      >
        <Modal.Body>
          <Row>
            <Col>
            <Container>
            <Row className="justify-content-md-center resultCol">
            {opChosenOnes.map((choice, idx) => {
                const choiceIdx = Number(choice);
                if(res[idx][1] === res[idx][0]) return (<Col key={idx}><p className="drawBorder"><img className="handImg" width={80} height={80} src={imgs[choiceIdx]} alt="nah" /></p></Col>)
                else if (res[idx][1] === 1) return (<Col key={idx}><p className="winBorder"><img className="handImg" width={80} height={80} src={imgs[choiceIdx]} alt="nah" /></p></Col>)
                else return (<Col key={idx}><p className="lossBorder"><img className="handImg" width={80} height={80} src={imgs[choiceIdx]} alt="nah" /></p></Col>)
              })}
            </Row>
          </Container>
            </Col>
            <Col xs lg="1">
              <span ><h1 className="point">{p2_score}</h1></span>
            </Col>
          </Row>
          <Row>
              <Col>
              <Container>
            {chosenOnes !== null ? (
              <Row className="justify-content-md-center resultCol">
               {chosenOnes.map((choice, idx) => {
                const choiceIdx = Number(choice);
                if(res[idx][1] === res[idx][0]) return (<Col key={idx}><p className="drawBorder"><img className="handImg" width={80} height={80} src={imgs[choiceIdx]} alt="nah" /></p></Col>)
                else if (res[idx][0] === 1) return (<Col key={idx}><p className="winBorder"><img className="handImg" width={80} height={80} src={imgs[choiceIdx]} alt="nah" /></p></Col>)
                else return (<Col key={idx}><p className="lossBorder"><img className="handImg" width={80} height={80} src={imgs[choiceIdx]} alt="nah" /></p></Col>)
              })} 
              </Row>
            ) : (
              <Row>
                <Col className="justify-content-center align-self-center">
                  <img
                    className="align-self-center"
                    width={80}
                    height={80}
                    src={none}
                    alt="nah"
                  />
                </Col>
                <Col className="justify-content-center">
                  <img width={80} height={80} src={none} alt="nah" />
                </Col>
                <Col className="mx-auto">
                  <img width={80} height={80} src={none} alt="nah" />
                </Col>
              </Row>
            )}
          </Container>
              </Col>
              <Col xs lg="1">
                <span><h1 className="point">{p1_score}</h1></span>
              </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const addWinnerAnnouncement = (winner, loser) => {
    announcements.push(`${winner} slapped ${loser} and won ${amount} SOL`)
  }

  const addDrawAnnouncement = () => {
    announcements.push(`It's a tie!`)
  }

  const WinPopper = () => {
    const current_player = Moralis.User.current().id;
    if (winner === current_player) {
      //addWinnerAnnouncement(user, opponent)
      return (
        <StyledModal
        size="sm"
        show={smShow}
        onHide={() => setSmShow(false)}
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
      >
        <Modal.Header>  <Modal.Title> <h2>{resultMessages[0].msg}</h2> </Modal.Title> </Modal.Header>
        <Modal.Body className="modalBody">
          <Container>
          <img className="resultImg" width={80} height={80}  src={resultMessages[0].img} alt=""/>
          <Button className="winningImg" onClick={() => {
            resetRoom()
            setSmShow(false)
          }}><h3>Rematch</h3></Button>
          <p style={{textAlign: "center"}}>with x Sol</p>
          <Button className="winningImg" onClick={ () => {
            resetRoom()
            leaveRoom(params.userId)
          }}>{resultMessages[0].leaveMsg}</Button>
          </Container>
        </Modal.Body>
      </StyledModal>
      )
    } else if (winner === "draw") {
      //addDrawAnnouncement()
      return(
        <StyledModal
        size="sm"
        show={smShow}
        onHide={() => setSmShow(false)}
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
      >
        <Modal.Header>  <Modal.Title> <h2>{resultMessages[2].msg}</h2> </Modal.Title> </Modal.Header>
        <Modal.Body className="modalBody">
          <Container>
          <img className="resultImg" width={80} height={80}  src={resultMessages[2].img} alt=""/>
          <Button className="winningImg" onClick={() => {
            resetRoom()
            setSmShow(false)
          }}><h3>Rematch</h3></Button>
          <p style={{textAlign: "center"}}>with x Sol</p>
          <Button className="winningImg" onClick={() => {
            resetRoom()
            leaveRoom(params.userId)
          }}>{resultMessages[2].leaveMsg}</Button>
          </Container>
        </Modal.Body>
      </StyledModal>
      ) ;
    } else {
     // addWinnerAnnouncement(opponent, user)
      return (
        <StyledModal
        size="sm"
        show={smShow}
        onHide={() => setSmShow(false)}
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
      >
        <Modal.Header>  <Modal.Title> <h2>{resultMessages[1].msg}</h2> </Modal.Title> </Modal.Header>
        <Modal.Body className="modalBody">
          <Container>
          <img className="resultImg" width={80} height={80}  src={resultMessages[1].img} alt=""/>
          <Button className="winningImg" onClick={() => {
            resetRoom()
            setSmShow(false)
          }}><h3>Rematch</h3></Button>
          <p style={{textAlign: "center"}}>with x Sol</p>
          <Button className="winningImg" onClick={() => {
            resetRoom()
            leaveRoom(params.userId)
          }}>{resultMessages[1].leaveMsg}</Button>
          </Container>
        </Modal.Body>
      </StyledModal>
      );
    }
  };

  const NoFundsPopper = () =>{
    return (
      <StyledModal
        size="sm"
        show={noFunds}
        onHide={() => setNoFunds(false)}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <Modal.Title>
            <h4>{resultMessages[3].msg}</h4>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modalBody">
          <Container>
            <img
              className="resultImg"
              width={100}
              height={100}
              src={resultMessages[3].img}
              alt=""
            />
            <Button
              className="winningImg"
              onClick={() => setNoFunds(false)}>
              {resultMessages[3].leaveMsg}
            </Button>
          </Container>
        </Modal.Body>
      </StyledModal>
    );
  }

  // Renderer callback with condition
  const renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed && modalShow) {
      return(<ShowResultsModal show={modalShow && completed} onHide={() => {
        setModalShow(false)
        setSmShow(true)
      }}/>)
    } else {
      // Render a countdown
      return <h3>SHOWING RESULTS IN {seconds} <img src={hg} width={60} height={60} /> SECONDS</h3>;
    }
  };

  const secRenderer = ({ hours, minutes, seconds, completed }) => {
    return <span>{seconds}</span>;
  };

  const checkSelected = async () => {
      if (chosenOnes.length !== 3){
        var arr = Array.from(chosenCards);
        while(arr.length !== 3){
            var r = Math.floor(Math.random() * 5);
            if(arr.indexOf(r) === -1){     
              arr.push(r);
              chosenOnes.push(generatedhands[r])
              setTotalSel(totalSelected + 1)
            }
        }

        setchosenCards(new Set(arr))
      }
  }

  const handleChoiceButton = async (event, id) => {
    setBox(id);
  };

 function generateHands(){
    var choices = []
    for (let i = 0; i < 5; i++){
      var r = Math.floor(Math.random() * 3);
      choices.push(r.toString());
    }
    setGenHands(choices)
   // setGen(false)
  }

 async function reveal3random() {
    if (generatedhands) {
      let arr = [];
      while (arr.length !== 3) {
        var r = Math.floor(Math.random() * 5); //generate 3 random indices
        if (arr.indexOf(r) === -1) {
          arr.push(r);
        }
      }
      setrevealedCards(new Set(arr));
      let toRevealCards = [];
      for(let i = 0; i < arr.length; i++){
        const aHand = generatedhands[i];
        const aHandIdx = arr[i];
        toRevealCards.push([aHand, aHandIdx])
      }

      const playerId = Moralis.User.current().id
      const aPlayerData = {player: playerId, cards: toRevealCards}
      const parameters = {room: roomId, playerData: aPlayerData}
      await Moralis.Cloud.run("revealCard", parameters); //runs a function on the cloud
      //return toRevealCards //is an array of tuples(card, cardIdx)
    }
  }

  async function getHands(){
    const challenger = Moralis.User.current().id;
    const params = { room: roomId , playerId: challenger};
    const hands = await Moralis.Cloud.run("ready3", params);
    return hands
  }

  const OptionDropDown = (props) => {
    if (mode) {
      return (
        <Col >
          <DropdownButton
            title={
              <img
                width={80}
                height={80}
                src={selectedChoice}
              />
            }
            disabled={choiceConfirmed}
            drop={"end"}
          >
            <Row >
              <Col>
                <Dropdown.Item>
                  <Button onClick={selectHand}>
                    <img id={Hands.rock} width={80} height={80} src={rock} />
                  </Button>
                </Dropdown.Item>
              </Col>
              <Col>
                <Dropdown.Item >
                  <Button onClick={selectHand}>
                    <img id={Hands.paper} width={80} height={80} src={paper} />
                  </Button>
                </Dropdown.Item>
              </Col>
              <Col>
                <Dropdown.Item>
                  <Button onClick={selectHand}>
                    <img
                      id={Hands.scissor}
                      width={80}
                      height={80}
                      src={scissor}
                    />
                  </Button>
                </Dropdown.Item>
              </Col>
            </Row>
          </DropdownButton>
        </Col>
      );
    } else {
      return (
        <Col id={props.id} className="cardCol">
          <Button
            onMouseOver={(e) => handleChoiceButton(e, props.id)}
            className="aCard"
            disabled={choiceConfirmed}
          >
          </Button>
        </Col>
      );
    }
  };

  const OppenentOptions = () => {
    return (
      <Row className="choiceRow">
      {cards.map((card, idx) => {
        return (
          <OptionDropDown
            key={idx.toString()}
            id={idx.toString()}
            img={card}
          />
        );
      })}
      </Row>
    );
  };

  const resetRoom = async () => {
      if (readyState){
        await Moralis.Cloud.run("rematch", {roomId: roomId,});
        setReadtState(false)
      }
    //if (winner) {
      setStarted(false);
      setConfirmed(false);
      setEndedDuel(false);
      setTotalSel(0);
      setOpChoseOnes(null);
      setChoseOnes([])
      setChoices([null, null, null, null, null])
      setCards([logo, logo, logo, logo, logo])
      setOpCards([logo, logo, logo, logo, logo])
      setGenHands(null)
      setchosenCards(new Set())
      setReveal(false)
      setWinner(null)
      setIsWinner(false)
      setBetProcess(false)
    //}
  };

  

  const transferToEscrow = async () => {
    /*    const getConfirmation = async (connection, tx) => {
      const result = await connection.getSignatureStatus(tx, {
        searchTransactionHistory: true,
      });
      return result.value?.confirmationStatus;
    }; */

    if (roomPDA) {
      setBetProcess(true)
      const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode('a_player_escrow_wallet'), publicKey.toBuffer()],
        program.programId
      );

      const pdaPK = new web3.PublicKey(roomPDA)

      try {
        const tx = await program.methods.transferro(
          new BN(
           amount //await Moralis.Cloud.run("getRoomBet", {room: roomId})
          *one_sol))
        .accounts({
          fromLockAccount: escrowPda,
          roomAccount: pdaPK,
          owner: publicKey
        }).rpc()
        //console.log(tx)
        const aPlayerData = {player: Moralis.User.current().id, tx: tx};
        await Moralis.Cloud.run("confirmTransaction", {room: roomId, playerData: aPlayerData})
      } catch (err) {
        //console.log(err)
      }
    }
  };

  const payo = async () => {
    const awinner = Moralis.User.current().get("solAddress");
    const dest = new web3.PublicKey(awinner);
    const pdaPK = new web3.PublicKey(roomPDA);

    try {
      let tx = await program.methods
        .payout()
        .accounts({
          winner: dest,
          feeAcc: fee_wallet,
          roomAccount: pdaPK,
        })
        .rpc();
      //console.log(tx);
    } catch (err) {
      //console.log(err);
    }
  };


  const payWinner = async (awinner) => {
    const payo = async () => {
      const awinner = Moralis.User.current().get("solAddress");
      const dest = new web3.PublicKey(awinner);
      const pdaPK = new web3.PublicKey(roomPDA);

      try {
        let tx = await program.methods
          .payout()
          .accounts({
            winner: dest,
            feeAcc: fee_wallet,
            roomAccount: pdaPK,
          })
          .rpc();
       // console.log(tx);
      } catch (err) {
       // console.log(err);
      }
    };

    //before paying we first check again who the winner is
    if (duelEnded && canPay) {
      if (winner === Moralis.User.current().id && winner === awinner) {
        const params = { room: roomId };
        // Fetch our Room Escrow PDA
        if (await Moralis.Cloud.run("checkWinner", {user: Moralis.User.current().id,room: roomId})) {
          try {
            if (await Moralis.Cloud.run("checkWinner", {user: Moralis.User.current().id, room: roomId})) {
              const current_wins = Moralis.User.current().get("wins");
              Moralis.User.current().set("wins", current_wins + 1);
              await Moralis.User.current().save();

              //const playerWallet = Moralis.Moralis.User.current().get("player_wallet"); //error 3011, account not owned by system program...
              const playerWallet = Moralis.User.current().get("solAddress");
              const winnerPk = new anchor.web3.PublicKey(playerWallet);
              await payo()
            } else alert("you did not win... 1");
          } catch (err) {
           alert("Some problems... ", err);
          }
        } else alert("you did not win... 2");
      } else alert("you did not win... 3");
    }
  };

  const isOwner = async() =>{
    const user = Moralis.User.current().getUsername()
    const params = { player: user, roomId: roomId}
    const is_owner = await Moralis.Cloud.run("isOwner", params); //runs a function on the cloud
    if (is_owner){
      setOwner(true)
    }
    else setOwner(false)
  }

  const getReady = async () =>{
    if (await canPlay()){
      const params = { roomId: roomId };
      await Moralis.Cloud.run("getReady", params); //runs a function on the cloud
      setReadtState(true)
    }
    else{
      setNoFunds(true)
    }
  }

  useEffect(() => {
    const fetchPdaAtEnterRoom = async () => {
      if (!roomPDA) {
        const params = { room: roomId };
        const aPDA = await Moralis.Cloud.run("findPDA", params);
        const addr1 = aPDA.get("players")[0];
        const addr2 = aPDA.get("players")[1];
        const pk1 = new anchor.web3.PublicKey(addr1);
        const pk2 = new anchor.web3.PublicKey(addr2);
        const [testCrowPDA, testCrowPDABump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [
              Buffer.from(aPDA.get("random_string")),
              pk1.toBuffer(),
              pk2.toBuffer(),
            ],
            program.programId
          );
        setRoomPda(testCrowPDA.toBase58());
      }
    };

    const enterRoomPing = async () => {
        let query = new Moralis.Query("Room");
        query.get(roomId);
        query.equalTo("challenger", "null");
        let subscription = await query.subscribe();
        subscription.on("leave", (object) => {
          getRoomData(roomId);
        });
        subscription.on("enter", (object) => {
          getRoomData(roomId);
          setOpponent(null);
        });
    };

    const leaveRoomPing = async () => {
      if (roomId){
        let query = new Moralis.Query("Room");
        query.get(roomId);
        query.equalTo("challenger", "null");
        let subscription = await query.subscribe();
        subscription.on("enter", (object) => {
          getRoomData(roomId);
          setOpponent(null);
        });
      }
    };

    //get player 2's key to find PDA
    const readyPdaPing = async () => {
      let query = new Moralis.Query("Pda");
      query.equalTo("room", roomId);
      query.equalTo("ready", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async (object) => {
        const addr1 = object.get("players")[0];
        const addr2 = object.get("players")[1];
        const pk1 = new anchor.web3.PublicKey(addr1);
        const pk2 = new anchor.web3.PublicKey(addr2);
        const [testCrowPDA, testCrowPDABump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [
              Buffer.from(object.get("random_string")),
              pk1.toBuffer(),
              pk2.toBuffer(),
            ],
            program.programId
          );
        setRoomPda(testCrowPDA.toBase58());
      });
    };

    const readyPing = async () => {
      let query = new Moralis.Query("Room");
      query.get(roomId);
      query.equalTo("ready", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async () => {
        if (isOwner()){
          setReadtState(true)
        }
      });
/*      subscription.on("leave", async () => {
        if (isOwner()){
          //setReadtState(false)
        }
      }); */ 
    };


    const updateOpponentData = (players) => {
        const curr_user_id = Moralis.User.current().id;
        const player_one = players[0];
        const player_two = players[1];
        if (mode){
          if (curr_user_id === player_one.player) {
            setOpponentsChoice(player_two.choice);
          } 
          else setOpponentsChoice(player_one.choice);
        }
        else{
          
          if (curr_user_id === player_one.player) {
            setOpChoseOnes(player_two.choice);
       //     player_two.choiceIndexes.forEach((aChoice, index) => {
         //     opCards[aChoice] = imgs[Number(player_two.choice[index])]
          //  })
          } 
          else {
            setOpChoseOnes(player_one.choice);
           // player_one.choiceIndexes.forEach((aChoice, index) => {
             // opCards[aChoice] = imgs[Number(player_one.choice[index])]
           // })
          }
        }
    };


    const gameStartPing = async () => {
      let query = new Moralis.Query("Room");
      query.get(roomId);
      query.equalTo("playing", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async () => {
        transferToEscrow()
        subscription.unsubscribe();
      });
    };

    const gamePlayingPing = async () => {
      let query = new Moralis.Query("Duel");
      query.equalTo("room", roomId);
      query.equalTo("ready", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async (object) => {
        start()
       // subscription.unsubscribe();
      });
    };

    //so we know when we can fetch the winner
    const gameEndedPing = async () => {
      let query = new Moralis.Query("Duel");
      query.equalTo("room", roomId);
      query.equalTo("ended", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async (object) => {
        updateOpponentData(object.get("players"))
        setEndedDuel(true); //COUNTDOWN
        setWinner(object.get("winner"));
        setModalShow(true);
        if (Moralis.User.current().id === object.get("winner")) {
          setIsWinner(true)
        }
       // subscription.unsubscribe();
      });
    };

    const paymentProcessedPing = async () => {
      let query = new Moralis.Query("Transaction");
      query.equalTo("room", roomId);
      query.equalTo("processed", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async () => {
        setBetProcess(false)
        generateHands()
        subscription.unsubscribe();
      });
    };

    if (roomId) {
      setUser(Moralis.User.current().getUsername());
      isOwner()
      enterRoomPing();
    }

    if (roomId && readyState){
      gameStartPing(); //to check if servers got both choices of players
      gamePlayingPing();
      paymentProcessedPing()
    }

    if(choiceConfirmed && gameStarted){
      sendSelectedHand()
    }

    if (roomId && opponent){
      readyPing()
    }

    if (gameStarted && roomId) {
      gameEndedPing();
    }

    if (totalSelected === 3 || chosenCards.size === 3) {
      setConfirmed(true);
    }

    if (duelEnded && opChosenOnes){
      setSelectEnded(true)
    }
    
  }, [
    isAuthenticated,
    roomId,
    gameStarted,
    roomPDA,
    duelEnded,
    winner,
    canPay,
    opponent,
    totalSelected,
    chosenCards,
    choiceConfirmed,
    owner,
    readyState,
    opChosenOnes
  ]);

  useEffect(() => {
    
    const update_playerStats = async(player) =>{
      const current_wins = player.get("wins")
      player.set("wins", current_wins + 1)
      player.save()
    }

    if (isAuthenticated) {
      setRoomId(params.userId);
      getRoomData(params.userId);
    }

    if (winner && smShow){
      const current_player = Moralis.User.current()
      if (winner === current_player.id) {
        addWinnerAnnouncement(user, opponent)
        if(soundState)winSound()
        payo()
        update_playerStats(current_player)
      }
      else if (winner === "draw") {
        addDrawAnnouncement()
        if(soundState)tieSound()
      }
      else{
        addWinnerAnnouncement(opponent, user)
        if(soundState)loseSound()
      }
    }

  }, [isAuthenticated, mode, winner, smShow]);

  useEffect(() => {

    const revealOpponentData = (players) => {
      const curr_user_id = Moralis.User.current().id;
      const player_one = players[0];
      const player_two = players[1];

      if (curr_user_id === player_one.player) {
        player_two.cards.forEach((aChoice, index) => {
          const aHand = aChoice[0];
          const aHandIdx = aChoice[1];
          opCards[aHandIdx] = imgs[Number(aHand)]
        })
      } 
      else {
        player_one.cards.forEach((aChoice, index) => {
          const aHand = aChoice[0];
          const aHandIdx = aChoice[1];
          opCards[aHandIdx] = imgs[Number(aHand)]
        })
      }
      setStarted(true); 
  };

    const revealPing = async () => {
      let query = new Moralis.Query("Duel");
      query.equalTo("room", roomId);
      query.equalTo("revealed", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async (object) => {
        revealOpponentData(object.get("reveals"))
        setReveal(true)
        subscription.unsubscribe()
      });
    };

    if(generatedhands && roomId){
      reveal3random()
      revealPing()
    }

 /*   if(generatedhands && gameStarted && reveal && !selectEnded && soundState){
      ctdwnSound()
    }
 */
  }, [generatedhands, roomId]);

  useEffect(() => {
    AOS.init({ 
      duration: 1500,
      offset:0
    });
  }, []);

  if (isAuthenticated && roomId) {
    return (
      <Container fluid="xxl" className="roomContainer">
        <NoFundsPopper />
        <Row>
          {winner ? <WinPopper /> : <div></div>}
          <Col>
            <br />
            <div>
              <StartBtn onClick={() => leaveRoom(params.userId)}>
                Leave
              </StartBtn>
            </div>
            <br />
            <Container className="chatContainer">
              <DiscordChat />
            </Container>
          </Col>
          <Col xs={7} className="mainCol">
            <Container>
              <Row className="justify-content-md-center">
                <Container style={{ width: "90%" }}>
                  {generatedhands && opCards && reveal ? (
                    <Row className="choiceRow">
                      {opCards.map((aCard, idx) => {
                        if (aCard !== logo) {
                          return (
                            <Col
                              className="aselectedCard cardCol"
                              data-aos="fade-down"
                            >
                              <Button className="aCardRev">
                                <AiFillEye className="selectedCard" />
                                <img
                                  className="handImg"
                                  width={60}
                                  height={60}
                                  src={aCard}
                                  alt="nah"
                                />
                              </Button>
                            </Col>
                          );
                        } else
                          return (
                            <Col data-aos="fade-down" className="cardCol">
                              <Button className="aCard" />
                            </Col>
                          );
                      })}
                    </Row>
                  ) : (
                    <OppenentOptions />
                  )}
                </Container>
              </Row>
              <Row className="justify-content-md-center boxContent">
                <Col xs={2}>
                  <Container>
                    {owner ? (
                      <Row>
                        <StartBtn disabled={!readyState} onClick={startRound}>
                          Start
                        </StartBtn>
                      </Row>
                    ) : (
                      <div></div>
                    )}
                  </Container>
                </Col>
                <Col lg={7}>
                  {duelEnded && opChosenOnes ? (
                    <Container>
                      <Countdown date={Date.now() + 3000} renderer={renderer} />
                    </Container>
                  ) : (
                    //winner should be shown here
                    <Container>
                      <Row>
                        <Col>
                          {betProcessing ? (
                            <Container style={{ margin: "auto" }}>
                              <Loading
                                spinnerColor="#444343"
                                text={<h3>Both payments are processing...</h3>}
                              />
                            </Container>
                          ) : (
                            <Container>
                              {owner ? (
                                <div>
                                  <h1 className="room_name">Room {roomName}</h1>
                                  <h4> Waiting for challenger to be ready </h4>
                                  <h3>Challenger: {opponent}</h3>
                                  <h4>{amount} SOL PER MATCH</h4>
                                </div>
                              ) : (
                                <div>
                                  <h1 className="room_name">Room {roomName}</h1>
                                  <h4> Click on ready </h4>
                                  <h3>Opponent: {opponent}</h3>
                                  <h4>{amount} SOL PER MATCH</h4>
                                </div>
                              )}
                            </Container>
                          )}
                        </Col>
                      </Row>
                    </Container>
                  )}
                  {generatedhands && gameStarted && reveal ? (
                    <div>
                      <CustomCountDown
                        seconds={10}
                        check={checkSelected}
                        ended={selectEnded}
                      />
                    </div>
                  ) : (
                    <div></div>
                  )}
                </Col>
                <Col xs={3}>
                  <Container>
                    <div>
                      {!owner ? (
                        <div>
                          <StartBtn disabled={readyState} onClick={getReady}>
                            Ready
                          </StartBtn>
                          {/* <Button disabled={!readyState} onClick={resetRoom}>Uneady</Button> */}
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                    <Container className="deckContainer">
                      <img width={280} height={250} src={deck} />
                    </Container>
                    <div>
                      {soundState ? (
                        <Button onClick={() => setSoundState(false)}>
                          <FaVolumeUp size={30} />
                        </Button>
                      ) : (
                        <Button onClick={() => setSoundState(true)}>
                          <BiVolumeMute size={30} />
                        </Button>
                      )}
                    </div>
                  </Container>
                </Col>
              </Row>
              <Row className="justify-content-md-center">
                {mode ? (
                  <OptionDropDown id={"1"} />
                ) : (
                  <Container style={{ width: "90%" }}>
                    {readyState ? (
                      <div>
                        {generatedhands ? (
                          <Row className="choiceRow">
                            {generatedhands.map((aHand, index) => {
                              const handIdx = Number(aHand);
                              return (
                                <Col
                                  data-aos="fade-up"
                                  className={` cardCol ${
                                    chosenCards.has(index)
                                      ? "bselectedCard"
                                      : ""
                                  }`}
                                >
                                  <Button
                                    onMouseOver={(e) =>
                                      handleChoiceButton(e, index)
                                    }
                                    onClick={selectCard}
                                    className="aCardRev"
                                    disabled={choiceConfirmed}
                                  >
                                    {revealedCards.has(index) ? (
                                      <AiFillEye className="selectedCard" />
                                    ) : (
                                      <div></div>
                                    )}
                                    <img
                                      className="handImg"
                                      width={60}
                                      height={60}
                                      src={imgs[handIdx]}
                                      alt="nah"
                                    />
                                  </Button>
                                </Col>
                              );
                            })}
                          </Row>
                        ) : (
                          <div> </div>
                        )}
                      </div>
                    ) : (
                      <Row className="choiceRow">
                        {cards.map((card, idx) => {
                          return (
                            <OptionDropDown
                              key={idx.toString()}
                              id={idx.toString()}
                              img={card}
                            />
                          );
                        })}
                      </Row>
                    )}
                  </Container>
                )}
              </Row>
            </Container>
          </Col>
          <Col className="annns">
            <Row>
              <Container className="announcementsContainer">
                <RTable responsive borderless>
                  <thead>
                    <tr>
                      <th colSpan={4}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((announcement) => {
                      return (
                        <tr>
                          <td colSpan={4}>{announcement}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </RTable>
              </Container>
            </Row>
            <Row>
              <Col>
                <a target="_blank" href="https://discord.gg/VufJp2EY">
                  <img width={50} height={50} src={dsc} alt="discord"></img>
                </a>
              </Col>
              <Col>
                <a>
                  <img width={50} height={50} src={me}></img>
                </a>
              </Col>
              <Col>
                <a target="_blank" href="https://twitter.com/AsakaLabs">
                  <img width={50} height={50} src={twt} alt="twitter"></img>
                </a>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    );
  } else
    return (
      <Container>
        <h2>You need to be authenticated</h2>
      </Container>
    );
};

export default Rooms;



class CustomCountDown extends React.Component {
  constructor(props){
    super(props)
    this.tick = this.tick.bind(this)
    this.state = {seconds: props.seconds, ended:false}
    this.ended = props.ended
    this.checkFun = {checkFun: props.check}

  }

  componentDidMount(){
    this.timer = setInterval(this.tick, 1000);
  }
  tick(){
    if (this.state.seconds > 0 && !this.state.ended) {
      this.setState({seconds: this.state.seconds - 1})
    }
    else if (this.state.seconds === 0 || !this.state.ended){
      this.setState({ended: true})
      this.checkFun.checkFun()
    }
    else {
      clearInterval(this.timer);
    }
  }

  render(){
    if (!this.state.ended){
      return (
        <div style={{ width: "100%", textAlign: "center" }}>
          <Row>
          <Col md={9} className="countDownCol">
            <Row><h3> TIME REMAINING </h3></Row>
            <Row><h1>{this.state.seconds} SECONDS </h1></Row>
          </Col>
          <Col xs={1}> <img src={hg} width={80} height={80} /></Col>
          </Row>
        </div>
      );
    }
    else return(
      <div></div>
    )
  }
}