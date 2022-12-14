import {
  Container,
  Button,
  Row,
  Col,
  DropdownButton,
  Dropdown,
  Modal,
  Table as RTable, Badge
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import Moralis from "moralis";
import { useMoralis } from "react-moralis";

import React,{ useEffect, useState, useMemo, useRef  } from "react";
import { Loading } from "@web3uikit/core";
import Countdown from "react-countdown";
import rock from "./media/cards/rock.png";
import paper from "./media/cards/paper.png";
import scissor from "./media/cards/scissor.png";
import none from "./media/cards/unkown.PNG";
import logo from "./media/cards/card2.png";
import me from "./media/ME.png";
import twt from "./media/twitter.png";

import r1 from "./media/results/r1.png";
import r2 from "./media/results/r2.png";
import r3 from "./media/results/r3.png";
import r4 from "./media/results/r4.jpg";

import AOS from "aos";

import "aos/dist/aos.css";

import {AiFillEye } from 'react-icons/ai'
import  {FaVolumeUp, FaDiscord} from 'react-icons/fa'
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
import { LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
  import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    createAssociatedTokenAccountInstruction
  } from "@solana/spl-token";
import base58 from 'bs58'
import {network, idl} from '../rpc_config'

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
  "5HBjN8gPUzrdYpQuTspZakCZXuZHDMsvHNwH3qVTbnHN"
);
const one_sol = 1_000_000_000;

const Rooms = (props) => {
  const params = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useMoralis();

  const [smShow, setSmShow] = useState(false);

  const [mode, setMode] = useState(false);
  const [selectedBox, setBox] = useState(null);

  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [roomPDA, setRoomPda] = useState(null);
  const [roomATA, setRoomATA] = useState(null);
  const [contract, setContract] = useState(null)

  const [opponent, setOpponent] = useState(null);
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
  const [generatedhands, setGenHands] = useState([]);

  const [choiceConfirmed, setConfirmed] = useState(false);
  const [readyState, setReadtState] = useState(false)
  const [duelEnded, setEndedDuel] = useState(false);
  const [canPay, setCanPay] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [canStart, setCanStart] = useState(false);

  const [winner, setWinner] = useState(null);
  const [isWinner, setIsWinner] = useState(false)

  const [user, setUser] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [totalSelected, setTotalSel] = useState(0);
  const [owner, setOwner] = useState(false)

  const [chosenOnes, setChoseOnes] = useState([]);
  const [opChosenOnes, setOpChoseOnes] = useState([]);

  const [winSound] = useSound(winnerSound);
  const [loseSound] = useSound(loser);
  const [tieSound] = useSound(tie);
  const [ctdwnSound] = useSound(countdownSound);
  const [announcements, setAnnouncements] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [noFunds, setNoFunds] = useState(false);
  const [selectEnded, setSelectEnded] = useState(false)
  const [betProcessing, setBetProcess] = useState(false)
  const [roomReset, setReset] = useState(false)

  const [balance, setBalance] = useState(props.bal);

  const [generated, setGenerated] = useState(false)
  const [canGen, setCanGen] = useState(false)
  const [roundStarted, setRoundStart] = useState(false)
  const [revealDone, setRevealDone] = useState(false)
  const [cardSent, setCardSent] = useState(false)



//["2", "0", "0", "2", "1"]

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

  const connection = new web3.Connection(network, "processed");
  const provider = new AnchorProvider(connection, anchorWallet, {preflightCommitment: "processed"});
  const program = new Program(idl, idl.metadata.address, provider);


  const navigateToDashboard = () => {
    navigate(`/`);
  };

  const leaveRoom = async (anid) => {
    const user = Moralis.User.current().getUsername();
    const id = anid;
    const params = { roomId: id, player: user };
    const canLeave = await Moralis.Cloud.run("leaveRoom", params);
    if (canLeave) {
      //await Moralis.Cloud.run("rematch", {roomId: roomId, userId: Moralis.User.current().id});
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
    if(roomData){
      setRoomName(roomData.get("room_name"));
      setRoomPda(roomData.get("room_address"))
      setRoomATA(roomData.get("roomATA"));
      setAmount(roomData.get("bet_amount"));
      setContract(roomData.get("contract"));

      if(roomData.get("ready")) setReadtState(true)
      if (roomData.get("challenger") !== "null") {
        if (username === roomData.get("owner"))
          setOpponent(roomData.get("challenger").substring(0,15));
        else setOpponent(roomData.get("owner").substring(0,15));
      }
    }
  };

  const setRoomData = (aRoom) => {
    const username = Moralis.User.current().getUsername();
    setRoomName(aRoom.get("room_name"));
    setRoomPda(aRoom.get("room_address"))
    setRoomATA(aRoom.get("roomATA"));
    setAmount(aRoom.get("bet_amount"));
    setContract(aRoom.get("contract"));

    if(aRoom.get("ready")) setReadtState(true)
    if (aRoom.get("challenger") !== "null") {
      if (username === aRoom.get("owner"))
        setOpponent(aRoom.get("challenger").substring(0,15));
      else setOpponent(aRoom.get("owner").substring(0,15));
    }
  };

  const canPlay = async () => {
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet");
    const escrow = new anchor.web3.PublicKey(playerPDA)
    const abalance = await provider.connection.getBalance(escrow); //player escrow
    const roundedBalance = Math.round((abalance / one_sol)  * 100) / 100
   // console.log(contract)
    if(contract){
      const mint = new anchor.web3.PublicKey(contract)
      let escrowATA = await getAssociatedTokenAddress(
        mint, //mint pk
        escrow //to pk
      );
      const bal = ((await program.provider.connection.getParsedAccountInfo(escrowATA)).value.data.parsed.info.tokenAmount.amount)/one_sol;
    //  console.log(bal)
    //  console.log(roundedBalance)
      if (bal >= amount && roundedBalance > 0.001) return true
      else return false

    }
    else{
      if (roundedBalance > amount) return true
      else return false
    }
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

  const selectCard = () =>{
    if (chosenCards.size < 3){
      if(!chosenCards.has(selectedBox)){
        chosenCards.add(selectedBox)
        chosenOnes.push(generatedhands[selectedBox])
        setTotalSel(totalSelected + 1);
      }
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
        setCardSent(true)
      }
    }
  };

  const startRound = async () => {
    //sign transaction & send hands to DB
    if (await canPlay()){
      setRoundStart(true)
      const params = { room: roomId };
      await Moralis.Cloud.run("startRound", params); //runs a function on the cloud
    } else setNoFunds(true)
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
          <Button className="winningImg" onClick={doRemath}><h3>Rematch</h3></Button>
          <p style={{textAlign: "center"}}>with x Sol</p>
          <Button className="winningImg" onClick={leaveWithShame}>{resultMessages[0].leaveMsg}</Button>
          </Container>
        </Modal.Body>
      </StyledModal>
      )
    } else if (winner === "draw") {
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
          <Button className="winningImg" onClick={doRemath}><h3>Rematch</h3></Button>
          <p style={{textAlign: "center"}}>with x Sol</p>
          <Button className="winningImg" onClick={leaveWithShame}>{resultMessages[2].leaveMsg}</Button>
          </Container>
        </Modal.Body>
      </StyledModal>
      ) ;
    } else {
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
          <Button className="winningImg" onClick={doRemath}><h3>Rematch</h3></Button>
          <p style={{textAlign: "center"}}>with x Sol</p>
          <Button className="winningImg" onClick={leaveWithShame}>{resultMessages[1].leaveMsg}</Button>
          </Container>
        </Modal.Body>
      </StyledModal>
      );
    }
  };

  const leaveWithShame = async () =>{
    if(canClose){
      await Moralis.Cloud.run("rematch", {roomId: roomId, userId: Moralis.User.current().id});
      resetRoom()
      setSmShow(false)
      leaveRoom(params.userId)
    }
  }

  const doRemath = async () =>{
    if(canClose){
      await Moralis.Cloud.run("rematch", {roomId: roomId, userId: Moralis.User.current().id});
      resetRoom()
      setSmShow(false)
    }
  }

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
   // console.log("generated ",choices)
    setGenHands(choices)
    setCanGen(false)
    return choices
   // setGen(false)
  }

  async function reveal3random(someHands) {
    //if (!generated) {
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
        const aHand = someHands[i];
        const aHandIdx = arr[i];
        toRevealCards.push([aHand, aHandIdx])
      }

      //console.log("to reveal ", toRevealCards)
      const playerId = Moralis.User.current().id
      const aPlayerData = {player: playerId, cards: toRevealCards}
      const parameters = {room: roomId, playerData: aPlayerData}
      await Moralis.Cloud.run("revealCard", parameters); //runs a function on the cloud
      setCanStart(false)

     // setGenerated(true)
      
      //return toRevealCards //is an array of tuples(card, cardIdx)
    //}
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

  const resetRoom = () => {
    if(readyState){
      setReadtState(false)
    }

    //if (winner) {
      setConfirmed(false);
      setEndedDuel(false);
      setStarted(false)
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

      setGenerated(false)
      setCanGen(false)
      setRoundStart(false)
      setRevealDone(false)
      setCardSent(false)
      setCanClose(false)

      setReset(true)
      //if (readyState){

     // }
    //}
  };

  function handleChangeBalance(value) {
    props.onChangeBalance(value);
  }

  const getBalance = async () => {
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet");
    if (playerPDA) {
      const escrow = new anchor.web3.PublicKey(playerPDA)
      try {
        const abalance = await provider.connection.getBalance(escrow); //player escrow
        //props.onChangeBalance(Math.round((abalance / one_sol)  * 100) / 100);
        handleChangeBalance(Math.round((abalance / one_sol)  * 100) / 100)
      // setBalance(Math.round((abalance / one_sol)  * 100) / 100)
      } catch (err) {
      }
    }
  };

  function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const transferRoom = async () =>{

    try{
      const roomEscrow = new PublicKey(roomPDA);
      const aUser = Moralis.User.current();
      const walletQry = new Moralis.Query("Wallet")
      walletQry.equalTo("owner", aUser.id)
      const aWallet = await walletQry.first()
      const arraybuf = await _base64ToArrayBuffer(aWallet.get("key"))
      const u8int= new Uint8Array(arraybuf)
      const escrowWallet = anchor.web3.Keypair.fromSecretKey(u8int)

      const tx = await program.methods.payRoom(
        new BN(//await Moralis.Cloud.run("getRoomBet", {room: roomId})
          (amount *LAMPORTS_PER_SOL) - (LAMPORTS_PER_SOL*0.00001)))
      .accounts({
        escrowAcc: escrowWallet.publicKey,
        roomAcc: roomEscrow,
      }).transaction()
      const aConnection = new web3.Connection(network, 'finalized');
      tx.feePayer = escrowWallet.publicKey;
      tx.recentBlockhash = await aConnection.getLatestBlockhash('finalized').blockhash;
      const signature = await web3.sendAndConfirmTransaction(connection, tx, [escrowWallet], 'processed');
     // console.log("tx ", signature)
      getBalance()
      setCanStart(true)
    }catch(err){
   //   console.log(err)
    }

  }

  const payoutWinner = async () =>{
    function _base64ToArrayBuffer(base64) {
      var binary_string = window.atob(base64);
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }
    try{
      const roomEscrow = new PublicKey(roomPDA);
      const aUser = Moralis.User.current();
      const playerPDA = aUser.get("player_wallet");
      const playerWallet = new anchor.web3.PublicKey(playerPDA)

      const roomData = await Moralis.Cloud.run("getRoomData", {roomId: roomId}); //runs a function on the cloud
      const arraybuf = await _base64ToArrayBuffer(roomData.get("rkey"))
      const u8int= new Uint8Array(arraybuf)
      const escrowWallet = anchor.web3.Keypair.fromSecretKey(u8int)


        const tx = await program.methods.payw(
          new BN(amount //await Moralis.Cloud.run("getRoomBet", {room: roomId})
          *LAMPORTS_PER_SOL*2))
        .accounts({
          roomAcc: roomEscrow,
          winner: playerWallet,
          feeAcc: fee_wallet,
          payer: escrowWallet.publicKey
        }).transaction()
        tx.feePayer = escrowWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
        const ctx = await sendAndConfirmTransaction(connection, tx, [escrowWallet]);
        setCanClose(true)
        //console.log("payout ", ctx)
        getBalance()
      }catch(err){
      //console.log(err)
    }  
  }

  const payoutDraw = async () =>{
    function _base64ToArrayBuffer(base64) {
      var binary_string = window.atob(base64);
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }
    try{
      const roomEscrow = new PublicKey(roomPDA);
      const aUser = Moralis.User.current();
      const playerPDA = aUser.get("player_wallet");
      const playerWallet = new anchor.web3.PublicKey(playerPDA)

      const roomData = await Moralis.Cloud.run("getRoomData", {roomId: roomId}); //runs a function on the cloud
      const arraybuf = await _base64ToArrayBuffer(roomData.get("rkey"))
      const u8int= new Uint8Array(arraybuf)
      const escrowWallet = anchor.web3.Keypair.fromSecretKey(u8int)


        const tx = await program.methods.payw(
          new BN(amount //await Moralis.Cloud.run("getRoomBet", {room: roomId})
          *LAMPORTS_PER_SOL))
        .accounts({
          roomAcc: roomEscrow,
          winner: playerWallet,
          feeAcc: fee_wallet,
          payer: escrowWallet.publicKey
        }).transaction()
        tx.feePayer = escrowWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
        const ctx = await sendAndConfirmTransaction(connection, tx, [escrowWallet]);
        setCanClose(true)
        //console.log("payout ", ctx)
        getBalance()
      }catch(err){
      //console.log(err)
    }  
  }

  const paySPL = async() => {
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet");
    if (playerPDA) {
      const escrow = new anchor.web3.PublicKey(playerPDA)
      const mint = new anchor.web3.PublicKey(contract)

      try {
        let escrowATA = await getAssociatedTokenAddress(
          mint, //mint pk
          escrow //to pk
        );
        if(roomATA){
          const roomAtaPk = new anchor.web3.PublicKey(roomATA)
          const walletQry = new Moralis.Query("Wallet")
          walletQry.equalTo("owner", aUser.id)
          const aWallet = await walletQry.first()
          if(aWallet){
            const arraybuf = await _base64ToArrayBuffer(aWallet.get("key"))
            const u8int= new Uint8Array(arraybuf)
            const escrowWallet = web3.Keypair.fromSecretKey(u8int)
            const roomescrow = new anchor.web3.PublicKey(roomPDA)

            const aConnection = new web3.Connection(network, 'finalized');
            const ptx = await program.methods.payRoom(new BN(0.001*LAMPORTS_PER_SOL))
            .accounts({
              escrowAcc: escrowWallet.publicKey,
              roomAcc: roomescrow,
            }).transaction()

            const tx = (await program.methods.transferPforge(new BN(amount*LAMPORTS_PER_SOL)).accounts({
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMint: mint,
              from: escrowATA,
              fromAuthority: escrowWallet.publicKey,
              to: roomAtaPk,
            }).transaction()).add(ptx) //.signers([escrowWallet]).rpc(); 

            tx.feePayer = escrowWallet.publicKey;
            tx.recentBlockhash = await aConnection.getLatestBlockhash('finalized').blockhash;
            const signature = await web3.sendAndConfirmTransaction(aConnection, tx, [escrowWallet], 'processed');

           // console.log(signature)
            const bal = (await program.provider.connection.getParsedAccountInfo(escrowATA)).value.data.parsed.info.tokenAmount.amount;
            props.fonChangeBalance(bal/LAMPORTS_PER_SOL)
            setCanStart(true)
          }
        }
      } catch (err) {
       // console.log(err)
      }}
  }

  const payDF = async() => {
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet");
    if (playerPDA) {
      const escrow = new anchor.web3.PublicKey(playerPDA)

      const mint = new anchor.web3.PublicKey(contract)

     // console.log(mint.toBase58())

      try {
        let escrowATA = await getAssociatedTokenAddress(
          mint, //mint pk
          escrow //to pk
        );
        if(roomATA){
          const roomAtaPk = new anchor.web3.PublicKey(roomATA)
          const walletQry = new Moralis.Query("Wallet")
          walletQry.equalTo("owner", aUser.id)
          const aWallet = await walletQry.first()
          if(aWallet){
            const arraybuf = await _base64ToArrayBuffer(aWallet.get("key"))
            const u8int= new Uint8Array(arraybuf)
            const escrowWallet = web3.Keypair.fromSecretKey(u8int)
            const roomescrow = new anchor.web3.PublicKey(roomPDA)

            const aConnection = new web3.Connection(network, 'finalized');

            const ptx = await program.methods.payRoom(new BN(0.001*LAMPORTS_PER_SOL))
            .accounts({
              escrowAcc: escrowWallet.publicKey,
              roomAcc: roomescrow,
            }).transaction()
          //  ptx.feePayer = escrowWallet.publicKey;
           // ptx.recentBlockhash = await aConnection.getLatestBlockhash('finalized').blockhash;

            const tx = (await program.methods.transferDust(new BN(amount*LAMPORTS_PER_SOL)).accounts({
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMint: mint,
              from: escrowATA,
              fromAuthority: escrowWallet.publicKey,
              to: roomAtaPk,
            }).transaction()).add(ptx) //.signers([escrowWallet]).rpc(); 

            tx.feePayer = escrowWallet.publicKey;
            tx.recentBlockhash = await connection.getLatestBlockhash('finalized').blockhash;
            const signature = await web3.sendAndConfirmTransaction(connection, tx, [escrowWallet], 'processed');

          //  console.log(signature)
            const bal = (await program.provider.connection.getParsedAccountInfo(escrowATA)).value.data.parsed.info.tokenAmount.amount;
            props.fonChangeBalance(bal/LAMPORTS_PER_SOL)
            setCanStart(true)
          }
        }
      } catch (err) {
      //  console.log(err)
      }}
  }

  const payoutSPL = async() => {
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet");
    if (playerPDA) {
      const escrow = new anchor.web3.PublicKey(playerPDA)
      const mint = new anchor.web3.PublicKey(contract)
      if(roomATA){
        const roomAtaPk = new anchor.web3.PublicKey(roomATA)
        try {
          let winnerATA = await getAssociatedTokenAddress(
            mint, //mint pk
            escrow //to pk
          );
          let feeATA = await getAssociatedTokenAddress(
            mint, //mint pk
            fee_wallet //to pk
          );
          const aRoom = await Moralis.Cloud.run("getRoomData", { roomId: roomId });
          if(aRoom){
            const aConnection = new web3.Connection(network, 'finalized');
            const arraybuf = await _base64ToArrayBuffer(aRoom.get("rkey"))
            const u8int= new Uint8Array(arraybuf)
            const roomWallet = web3.Keypair.fromSecretKey(u8int)
            const tx = await program.methods.paywSpl(new BN(2*amount*LAMPORTS_PER_SOL)).accounts({
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMint: mint,
              from: roomAtaPk,
              fromAuthority: roomWallet.publicKey,
              to: winnerATA,
              feeAcc: feeATA
            }).transaction() //.signers([escrowWallet]).rpc(); 

            tx.feePayer = roomWallet.publicKey;
            tx.recentBlockhash = await aConnection.getLatestBlockhash('finalized').blockhash;
            const signature = await web3.sendAndConfirmTransaction(connection, tx, [roomWallet], 'processed');
           // console.log(signature)
            const bal = (await program.provider.connection.getParsedAccountInfo(winnerATA)).value.data.parsed.info.tokenAmount.amount;
            props.fonChangeBalance(bal/LAMPORTS_PER_SOL)
            setCanClose(true)
          }
        } catch (err) {
         // console.log(err)
        }
      }
    }
  }

  const payoutDrawSPL = async() => {
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet");
    if (playerPDA) {
      const escrow = new anchor.web3.PublicKey(playerPDA)
      const mint = new anchor.web3.PublicKey(contract)
      if(roomATA){
        const roomAtaPk = new anchor.web3.PublicKey(roomATA)
        try {
          let winnerATA = await getAssociatedTokenAddress(
            mint, //mint pk
            escrow //to pk
          );
          let feeATA = await getAssociatedTokenAddress(
            mint, //mint pk
            fee_wallet //to pk
          );
          const aRoom = await Moralis.Cloud.run("getRoomData", { roomId: roomId });
          if(aRoom){
            const aConnection = new web3.Connection(network, 'finalized');
            const arraybuf = await _base64ToArrayBuffer(aRoom.get("rkey"))
            const u8int= new Uint8Array(arraybuf)
            const roomWallet = web3.Keypair.fromSecretKey(u8int)
            const tx = await program.methods.paywSpl(new BN(amount*LAMPORTS_PER_SOL)).accounts({
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMint: mint,
              from: roomAtaPk,
              fromAuthority: roomWallet.publicKey,
              to: winnerATA,
              feeAcc: feeATA
            }).transaction()
            tx.feePayer = roomWallet.publicKey;
            tx.recentBlockhash = await aConnection.getLatestBlockhash('finalized').blockhash;
            const signature = await web3.sendAndConfirmTransaction(connection, tx, [roomWallet], 'processed');
          //  console.log(signature)
            const bal = (await program.provider.connection.getParsedAccountInfo(winnerATA)).value.data.parsed.info.tokenAmount.amount;
            props.fonChangeBalance(bal/LAMPORTS_PER_SOL)
            setCanClose(true)
          }
        } catch (err) {
         // console.log(err)
        }
      }
    }
  }

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
      const rdy = await Moralis.Cloud.run("getReady", params); //runs a function on the cloud
      setReadtState(rdy)
    }else setNoFunds(true)
  }

  useEffect(() => {
    const enterRoomPing = async () => {
        if(roomId){
          let query = new Moralis.Query("Room");
          query.equalTo("objectId", roomId);
          query.equalTo("challenger", "null");
          let subscription = await query.subscribe();
          subscription.on("leave", (aRoom) => {
            setRoomData(aRoom);
          });
          subscription.on("enter", (aRoom) => {
            setRoomData(aRoom);
            setOpponent(null);
            setReadtState(false)
        });
        }
    };

    const readyPing = async () => {
      if (!gameStarted && !duelEnded && roomId){
        let query = new Moralis.Query("Room");
        query.equalTo("objectId", roomId);
        query.equalTo("ready", true);
        let subscription = await query.subscribe();
        subscription.on("enter", () => {
          if (owner){
            setReadtState(true)
            //subscription.unsubscribe()
          }
        });
/*        subscription.on("leave", async () => {
          if (isOwner()){
            setReadtState(false)
          }
        }); */
      }
    };

/*
    const unreadyPing = async () => {
      if(!gameStarted && !roomReset){
        let query = new Moralis.Query("Room");
        query.equalTo("objectId", roomId);
        query.equalTo("ready", true);
        let subscription = await query.subscribe();
        subscription.on("leave", async () => {
          if (owner && canClose){
            setReadtState(false)
            subscription.unsubscribe()
      }})
      }
    }; */

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
          } 
          else {
            setOpChoseOnes(player_one.choice);
          }
        }
    };

    const gameStartPing = async () => {
        let query = new Moralis.Query("Room");
        query.equalTo("objectId", roomId);
        query.equalTo("playing", true);
        let subscription = await query.subscribe();
        subscription.on("enter",() => {
          setCanGen(true)
          subscription.unsubscribe();
        });
    };

    const gamePlayingPing = async () => {
      let query = new Moralis.Query("Duel");
      query.equalTo("room", roomId);
      query.equalTo("ready", true);
      let subscription = await query.subscribe();
      subscription.on("enter",(object) => {
        updateOpponentData(object.get("players"))
        setWinner(object.get("winner"));
        if (Moralis.User.current().id === object.get("winner")) {
          setIsWinner(true)
        }
        subscription.unsubscribe();
      });
    };

    //so we know when we can fetch the winner
    const gameEndedPing = async () => {
      let query = new Moralis.Query("Duel");
      query.equalTo("room", roomId);
      query.equalTo("ended", true);
      let subscription = await query.subscribe();
      subscription.on("enter", () => {
        setEndedDuel(true); //COUNTDOWN
        setModalShow(true);
        setCardSent(false)
        subscription.unsubscribe();
      });
    };

    if (roomId) {
      setUser(Moralis.User.current().getUsername());
      isOwner()
      enterRoomPing();
    }

    if (roomId && opponent && owner) readyPing()

    
    if (readyState) {
      gameStartPing(); //to check if servers got both choices of players
    }

   // if(readyState && !gameStarted) unreadyPing()

    if (totalSelected === 3 || chosenCards.size === 3) setConfirmed(true);

    if(choiceConfirmed && gameStarted) sendSelectedHand()

    if (readyState && gameStarted) {
      gamePlayingPing();
      gameEndedPing();
    }

    if (duelEnded && opChosenOnes) setSelectEnded(true)
    
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
      if (winner === current_player.id && isWinner) {
        if(contract) payoutSPL()
        else payoutWinner()
        addWinnerAnnouncement(user, opponent)
        if(props.soundState)winSound()
        update_playerStats(current_player)
      }
      else if (winner === "draw") {
        if(contract) payoutDrawSPL() 
        else payoutDraw()
        addDrawAnnouncement()
        if(props.soundState)tieSound()
      }
      else{
        setCanClose(true)
        addWinnerAnnouncement(opponent, user)
        if(props.soundState)loseSound()
      }
    }

    if(roomReset){
      getRoomData()
      setReset(false)
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
        //subscription.unsubscribe()
      });
    };

    if(generatedhands && roomId)revealPing()

  }, [generatedhands, roomId, generated]);
  
  useEffect(() => {
    AOS.init({ 
      duration: 1500,
      offset:0
    });
  }, []);


  useEffect(() => {
    if (canGen && !revealDone){
      if(contract)  payDF() // paySPL() 
      else transferRoom()
      //const somehands = generateHands()
      //reveal3random(somehands)
      setRevealDone(true)
    }

    if (canStart){
      const somehands = generateHands()
      reveal3random(somehands)
    }
  }, [canGen, revealDone, canStart])

  if (isAuthenticated && roomId) {

    return (
      <Container
        fluid="xxl"
        className="roomContainer"
        style={{ height: "85vh" }}
      >
        <NoFundsPopper />
        <Row>
          {winner ? <WinPopper /> : <div></div>}
          <Col lg={9} className="mainCol">
            <Container>
              <Row className="justify-content-md-center">
                <Container>
                  {generatedhands && opCards && reveal ? (
                    <Row className="choiceRow" data-aos="fade-down">
                      {opCards.map((aCard, idx) => {
                        if (aCard !== logo) {
                          return (
                            <Col className="aselectedCard cardCol">
                              <Button className="aCardRev">
                                <AiFillEye size={25} className="selectedCard" />
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
                            <Col className="cardCol">
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
                        <StartBtn disabled={!readyState||roundStarted} onClick={startRound}>
                          Start
                        </StartBtn>
                      </Row>
                    ) : (
                      <div>
                        <Row>
                          <StartBtn disabled={readyState} onClick={getReady}>
                            Ready
                          </StartBtn>
                        </Row>
                      </div>
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
                                  <h3> VS. {opponent}</h3>
                                  <h4>{amount} SOL PER MATCH</h4>
                                </div>
                              ) : (
                                <div>
                                  <h1 className="room_name">Room {roomName}</h1>
                                  <h4> Click on ready </h4>
                                  <h3> VS. {opponent}</h3>
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
                        seconds={7}
                        check={checkSelected}
                      />
                    </div>
                  ) : (
                    <div></div>
                  )}
                </Col>
                <Col xs={2}>
                  <Container>
                    <Row>
                      <StartBtn disabled={readyState} onClick={() => leaveRoom(params.userId)}>
                        Leave
                      </StartBtn>
                    </Row>
                    <div>
                      <br />
                    </div>
                  </Container>
                </Col>
              </Row>
              <Row className="justify-content-md-center">
                {mode ? (
                  <OptionDropDown id={"1"} />
                ) : (
                  <Container>
                    {readyState ? (
                      <div>
                        {generatedhands ? (
                          <Row className="choiceRow" data-aos="fade-up">
                            {generatedhands.map((aHand, index) => {
                              const handIdx = Number(aHand);
                              return (
                                <Col
                                  className={` cardCol ${
                                    chosenCards.has(index)
                                      ? "bselectedCard"
                                      : ""
                                  }`}
                                >
                                       {chosenCards.has(index) ? 
                                        (<Badge bg="danger" className="selectIdx">
                                          Selected
                                        </Badge>) 
                                        : (<div></div>)}
                                  <Button
                                    onMouseOver={(e) =>
                                      handleChoiceButton(e, index)
                                    }
                                    onClick={selectCard}
                                    className="aCardRev"
                                    disabled={choiceConfirmed}
                                  >
                                    {revealedCards.has(index) ? (
                                      <AiFillEye size={25} className="selectedCard" />
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
                  <FaDiscord className="disca" size={60} fill={props.darkmode ? "#FFD966" : "#5b34eb"}/>
                </a>
              </Col>
              <Col>
                <a target="blank" href="https://magiceden.io/marketplace/asakalabsnft">
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
    else if (this.state.seconds === 0){
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
            <Row><h4> TIME REMAINING </h4></Row>
            <Row><h3>{this.state.seconds} SECONDS </h3></Row>
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