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

import React,{ useEffect, useState, useMemo, useRef } from "react";
import Chat from "./roomchat";
import { Loading, Table, Card, Tag } from "@web3uikit/core";
import Countdown from "react-countdown";

import rock from "./media/cards/rock.png";
import paper from "./media/cards/paper.png";
import scissor from "./media/cards/scissor.png";
import none from "./media/cards/unkown.PNG";
import sol from "./media/sol.png";
import logo from "./media/cards/card2.png";
import me from "./media/ME.png";
import twt from "./media/twitter.png";
import dsc from "./media/discord.png";

import {AiFillEye, AiFillSound, AiOutlineSound} from 'react-icons/ai'
import {FaDiscord} from 'react-icons/fa'
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
import winAnimation from './media/results/gif.gif'
import Buffer from 'buffer'

const network = "https://devnet.genesysgo.net/"; //devnet

const Hands = {
  rock: "0",
  paper: "1",
  scissor: "2",
  none: "3",
}

const imgs = [rock, paper, scissor]

const fee_wallet = new anchor.web3.PublicKey(
  "4mkNvUq24DN9g8EWuJWkc176t9PiRnRU4d3U8WuZ1TC1"
);
const one_sol = 1_000_000_000;

const Rooms = (props) => {
  const params = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useMoralis();

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
  const [chosenCards, setchosenCards] = useState(new Set());
  const [choices, setChoices] = useState([null, null, null, null, null]);
  const [cards, setCards] = useState([logo, logo, logo, logo, logo]);
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

  const [soundState, setSoundState] = useState(false)
  const [winSound] = useSound(winnerSound);
  const [loseSound] = useSound(loser);
  const [tieSound] = useSound(tie);
  const [ended, setEnded] = useState(false)
  const [announcements, setAnnouncements] = useState([
    `Sengo slapped ZMK and won ${amount} SOL`,
    `It's a tie!`,
    `ZMK slapped Sengo and won ${amount} SOL`
  ])



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

  const connection = new web3.Connection(network, "processed");
  const provider = new AnchorProvider(connection, anchorWallet, {preflightCommitment: "processed"});
  const program = new Program(idl, idl.metadata.address, provider);
  const roomMasterProgram = new Program(idl2, idl2.metadata.address, provider);


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
        setOpponent(roomData.get("challenger"));
      else setOpponent(roomData.get("owner"));
    }
  };

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
    if (readyState) {
      const params = { room: roomId };
      await Moralis.Cloud.run("startRound", params); //runs a function on the cloud
    }
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
    if (opChosenOnes){
      res = evaluateWinnerInUI();
    }

    return (  
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="ms-auto">{WinPopper()}</Modal.Title>
          </Modal.Header>
        <Modal.Body>
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
      if(soundState)winSound()
      addWinnerAnnouncement(user, opponent)
      //payWinner(Moralis.Moralis.User.current().get("solAddress"))
      return <span>You win!</span>
    } else if (winner === "draw") {
      if(soundState)tieSound()
      addDrawAnnouncement()
      return <span>Draw!</span>;
    } else {
      if(soundState)loseSound()
      addWinnerAnnouncement(opponent, user)
      return <span>You lose!</span>;
    }
  };

  // Renderer callback with condition
  const renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed && modalShow) {
      return(<ShowResultsModal show={modalShow && completed} onHide={() => {
        setModalShow(false)
        setIsWinner(false)
        resetRoom()
      }}/>)
    } else {
      // Render a countdown
      return <span>{seconds}</span>;
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

  async function generateHands(){
    var choices = []
    for (let i = 0; i < 5; i++){
      var r = Math.floor(Math.random() * 3);
      choices.push(r.toString());
    }
    setGenHands(choices)
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
        <Col id={props.id}>
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
     await Moralis.Cloud.run("rematch", {roomId: roomId,});
   // if (duelEnded && reset) {
      setReadtState(false)
      setStarted(false);
      setConfirmed(false);
      setEndedDuel(false);
      setTotalSel(0);
      setOpChoseOnes(null);
      setChoseOnes([])
      setChoices([null, null, null, null, null])
      setCards([logo, logo, logo, logo, logo])
      setGenHands(null)
      setchosenCards(new Set())
   // }
  };

  const transferToEscrow = async () => {
    if (roomPDA) {
      const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode('player_escrow_wallet'), publicKey.toBuffer()],
        program.programId
      );

      const pdaPK = new web3.PublicKey(roomPDA)

      try {
        const tx = await program.methods.transferro(new BN(amount*one_sol))
        .accounts({
          fromLockAccount: escrowPda,
          roomAccount: pdaPK,
          owner: publicKey
        }).rpc()
        await sendSelectedHand();
      } catch (err) {
      }
    }
  };

  const payWinner = async (winner) => {
    //before paying we first check again who the winner is
    if (duelEnded && canPay) {
      if (winner === Moralis.User.current().id) {
        const params = { room: roomId };
        const aPDA = await Moralis.Cloud.run("findPDA", params);
        const addr1 = aPDA.get("players")[0];
        const addr2 = aPDA.get("players")[1];
        const pk1 = new anchor.web3.PublicKey(addr1);
        const pk2 = new anchor.web3.PublicKey(addr2);
        // Fetch our Room Escrow PDA
        if (
          await Moralis.Cloud.run("checkWinner", {
            user: Moralis.User.current().id,
            room: roomId,
          })
        ) {
          try {
            const [roomEscrow, roomBump] =
              await anchor.web3.PublicKey.findProgramAddress(
                [
                  Buffer.from(aPDA.get("random_string")),
                  pk1.toBuffer(),
                  pk2.toBuffer(),
                ],
                program.programId
              );
            if (
              await Moralis.Cloud.run("checkWinner", {
                user: Moralis.User.current().id,
                room: roomId,
              })
            ) {
              const current_wins = Moralis.User.current().get("wins");
              Moralis.User.current().set("wins", current_wins + 1);
              await Moralis.User.current().save();

              //const playerWallet = Moralis.Moralis.User.current().get("player_wallet"); //error 3011, account not owned by system program...
              const playerWallet = Moralis.User.current().get("solAddress");
              const winnerPk = new anchor.web3.PublicKey(playerWallet);
              const tx = await program.methods
                .payWinner(
                  new BN(one_sol * amount * 2),
                  roomBump,
                  pk1,
                  pk2,
                  aPDA.get("random_string")
                )
                .accounts({
                  destination: winnerPk,
                  pda: roomEscrow,
                  systemProgram: anchor.web3.SystemProgram.programId,
                  feeAcc: fee_wallet,
                })
                .rpc();
            } else alert("you did not win... 1");
          } catch (err) {
           alert("Some problems... ", err);
          }
        } else alert("you did not win... 2");
      } else alert("you did not win... 3");
    }
  };

  const payo = async () => {
    if (roomPDA && publicKey){
     // let query = new Moralis.Moralis.Query("Pda");
     // query.equalTo("room", roomId);
    //  const arm = await (await query.first()).get("room_master")

      const dest = new web3.PublicKey("4mkNvUq24DN9g8EWuJWkc176t9PiRnRU4d3U8WuZ1TC1")
      const pdaPK = new web3.PublicKey(roomPDA)

      const [roomMasterPDA, roomMasterBump] = 
      await web3.PublicKey.findProgramAddress([Buffer.from("room_master"), publicKey.toBuffer()], 
      roomMasterProgram.programId) 

    try{
      let txInstruction = await roomMasterProgram.methods
      .payWinner(new BN(amount*one_sol), roomMasterBump, anchorWallet.publicKey)
      .accounts({
        puppet: pdaPK,
        puppetProgram: program.programId,
        destination: anchorWallet.publicKey,
        feeAcc: fee_wallet,
        authority: roomMasterPDA,
      })
      .transaction();

      let recentBlockhash = await connection.getLatestBlockhash("finalized")
      txInstruction.recentBlockhash = recentBlockhash.blockhash;
      txInstruction.feePayer = anchorWallet.publicKey;



      const signedTx = await anchorWallet.signTransaction(txInstruction);
      
      const signature = await provider.sendAndConfirm(txInstruction, [anchorWallet])
      //await provider.connection.sendRawTransaction(signedTx.serialize());
    
      //let ctx = await provider.sendAndConfirm(tx, [anchorWallet.payer]);
      }
      catch(err){
      }
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
    const params = { roomId: roomId };
    await Moralis.Cloud.run("getReady", params); //runs a function on the cloud
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
        getRoomData(params.userId);
      });
    };

    const leaveRoomPing = async () => {
      let query = new Moralis.Query("Room");
      query.get(roomId);
      query.equalTo("challenger", "null");
      let subscription = await query.subscribe();
      subscription.on("enter", (object) => {
        getRoomData(params.userId);
        setOpponent(null);
      });
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
      subscription.on("leave", async () => {
        subscription.unsubscribe()
        setReadtState(true)
      });
    };

    const unReadyPing = async () => {
      let query = new Moralis.Query("Room");
      query.get(roomId);
      query.equalTo("ready", false);
      let subscription = await query.subscribe();
      subscription.on("enter", async () => {
        subscription.unsubscribe()
        setReadtState(false)
      });
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
          } 
          else setOpChoseOnes(player_one.choice);
        }
    };

    const gameStartPing = async () => {
      let query = new Moralis.Query("Room");
      query.get(roomId);
      query.equalTo("playing", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async (object) => {
        generateHands()
        setStarted(true);
        subscription.unsubscribe();
      });
    };

    const gamePlayingPing = async () => {
      let query = new Moralis.Query("Duel");
      query.equalTo("room", roomId);
      query.equalTo("ready", true);
      let subscription = await query.subscribe();
      subscription.on("enter", async () => {
        start()
        subscription.unsubscribe();
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
        subscription.unsubscribe();
      });
    };

    if (isAuthenticated && roomId) {
      setUser(Moralis.User.current().getUsername());
      isOwner()

      enterRoomPing();
      leaveRoomPing();
      //readyPdaPing();
      readyPing()
      unReadyPing()
      gameStartPing(); //to check if servers got both choices of players
      gamePlayingPing()
    }

    if(choiceConfirmed && gameStarted){
      sendSelectedHand()
    }

    if (gameStarted && roomId) {
      gameEndedPing();
    }

    if (totalSelected === 3 || chosenCards.size === 3) {
      setConfirmed(true);
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
    choiceConfirmed
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      setRoomId(params.userId);
      getRoomData(params.userId);
    }

  }, [isAuthenticated, mode]);

  useEffect(() => {
    setSoundState(props.sound)
  }, [])
  

  if (isAuthenticated && roomId) {
    return (
      <Container fluid="xxl" className="roomContainer">
        <h2 className="room_name">Room: {roomName}</h2>
        <Row>
          <Col>
            <br />{" "}
            <div>
              <Button onClick={() => leaveRoom(params.userId)}>Leave</Button>
            </div>
            <br />
            <Container>
              {chatId != null ? (
                <Chat id={chatId} sender={user} />
              ) : (
                <Loading spinnerColor="#2E7DAF" text="Fetching Data..." />
              )}
            </Container>
          </Col>
          <Col xs={7}>
            <Container>
              <Row className="justify-content-md-center">
                <OppenentOptions />
              </Row>
              <Row className="justify-content-md-center">
                <Col>
                  <Container>
                    {owner ? (
                      <Row>
                        <Button disabled={!readyState} onClick={startRound}>
                          Start
                        </Button>
                      </Row>
                    ) : (
                      <div></div>
                    )}
                    <br />
                    <Row>
                      <Button onClick={resetRoom}>Reset</Button>
                    </Row>
                    <br />
                    <Row>
                      <Button onClick={transferToEscrow}>Pay</Button>
                    </Row>
                    <br />
                  </Container>
                </Col>
                <Col xs={7}>
                  {duelEnded && opChosenOnes ? (
                    <Container>
                      <Countdown date={Date.now() + 5000} renderer={renderer} />
                    </Container>
                  ) : (
                    //winner should be shown here
                    <Container>
                      <Row>
                        <Col>
                          {owner ? (
                            <span> Waiting for challenger to be ready </span>
                          ) : (
                            <div>
                              <span> Click on ready </span>
                              <h5>Opponent: {opponent}</h5>
                              <p>
                                Bet: {amount} <img src={sol} />
                              </p>
                            </div>
                          )}
                        </Col>
                        <Col xs lg="2">
                          {soundState ? (
                            <Button onClick={() => setSoundState(false)}>
                              <AiFillSound />
                            </Button>
                          ) : (
                            <Button onClick={() => setSoundState(true)}>
                              <AiOutlineSound />
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </Container>
                  )}
                  {generatedhands ? (
                    <CustomCountDown seconds={5} check={checkSelected} />
                  ) : (
                    <div></div>
                  )}
                </Col>
                <Col>
                  <Container>
                    <br />
                    <div>
                      {!owner ? (
                        <Row>
                          {!readyState ? (
                            <Button onClick={getReady}>Ready</Button>
                          ) : (
                            <Button onClick={getReady}>Unready</Button>
                          )}
                        </Row>
                      ) : (
                        <div></div>
                      )}
                    </div>
                    <br />
                    <Row>
                      <Button onClick={payo}>Claim</Button>
                    </Row>
                    <br />
                    <Row></Row>
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
                          <Row>
                            {generatedhands.map((aHand, index) => {
                              const handIdx = Number(aHand);
                              return (
                                <Col
                                  className={`${
                                    chosenCards.has(index)
                                      ? "aselectedCard"
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
                                    {chosenCards.has(index) ? (
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
          <Col>
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
                  <a><img width={50} height={50} src={dsc}></img></a>
                </Col>
                <Col>
                  <a><img width={50} height={50} src={me}></img></a>
                </Col>
                <Col>
                  <a><img width={50} height={50} src={twt}></img></a>
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
    this.ended = false
    this.checkFun = {checkFun: props.check}

  }

  componentDidMount(){
    this.timer = setInterval(this.tick, 1000);
  }
  tick(){
    if (this.state.seconds > 0 && !this.state.ended) {
      this.setState({seconds: this.state.seconds - 1})
    }
    else if (this.state.seconds === 0 && !this.state.ended){
      this.setState({ended: true})
      this.checkFun.checkFun()
    }
    else {
      clearInterval(this.timer);
    }
  }

  render(){
    return <div style={{width: "100%", textAlign: "center"}}>
      <h1>{this.state.seconds}</h1>
    </div>
  }
}