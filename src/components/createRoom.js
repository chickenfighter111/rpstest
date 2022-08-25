import React, { useState, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Moralis from "moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  AnchorProvider,
  BN,
  Program,
  utils,
  web3,
} from "@project-serum/anchor";
import { useParams, useNavigate } from "react-router-dom";

const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../rps_project.json");
const idl2 = require("../rps_signer.json");
const utf8 = utils.bytes.utf8;

function CreateRoom(props) {
  const [amount, setAmount] = useState(0);
  const [name, setName] = useState("");
  const { connected, wallet, publicKey, signTransaction, signAllTransactions } =
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
  const navigate = useNavigate();
  const connection = new web3.Connection(network, "processed");
  const provider = new AnchorProvider(connection, anchorWallet, {
    preflightCommitment: "processed",
  });
  const program = new Program(idl, idl.metadata.address, provider);
  const roomMasterProgram = new Program(idl2, idl2.metadata.address, provider);

  const set_amount = async (event) => {
    event.preventDefault();
    if (amount) {
      createRoom(); //works
    }
  };

  async function createRoom() {


    //game room
/*    const GameRoom = Moralis.Object.extend("Room");
    const aGameRoom = new GameRoom();
        aGameRoom.set("owner", owner);
    aGameRoom.set("bet_amount", Number(amount));
    aGameRoom.set("playing", false);
    aGameRoom.set("challenger", "null");
    aGameRoom.set("room_name", name); */
   
    const user = Moralis.User.current();
    const owner = user.getUsername();
    const paramz = {
      owner: owner,
      bet: Number(amount),
      room_name: name,
     // RoomPDA: roomPDA.toBase58(),
    }
    const aRoomObj = await Moralis.Cloud.run("createRoom", paramz)
    //aRoomObj.set("room_address", roomPDA.toBase58())
    const playerAddress = user.get("solAddress");
    const params = { solAddress: playerAddress, room: aRoomObj.id, roomMaster: playerAddress };    
    user.set("is_playing", true);
    user.set("in_room", aRoomObj.id);
    await user.save();

    //await Moralis.Cloud.run("createPDA", params); //runs a function on the cloud
    navigateToRoom(aRoomObj.id);
    
/*    const [roomPDA, roomBump] = 
    await web3.PublicKey.findProgramAddress([utf8.encode("a_room_escrow_wallet"), publicKey.toBuffer()],
      program.programId);

    try {
      await program.account.lockAccount.fetch(roomPDA);
    } catch (err) {
      await program.methods
        .initRoomEscrow()
        .accounts({
          signer: publicKey,
          roomAccount: roomPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
    }
    finally{
    } */
  }

  const navigateToRoom = (roomId) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleInput = (event) => {
    setAmount(event.target.value);
  };

  const handleInput2 = (event) => {
    setName(event.target.value);
  };

  return (
    <Form>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label>Amount</Form.Label>
        <Form.Control
          required
          type="number"
          value={amount}
          placeholder="Enter amount"
          onChange={handleInput}
        />
        <Form.Text className="text-muted">Amount of $SOL to bet</Form.Text>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Room name</Form.Label>
        <Form.Control
          value={name}
          onChange={handleInput2}
          type="text"
          placeholder="Choose a room name"
        />
      </Form.Group>
      <Button variant="primary" type="submit" onClick={set_amount}>
        Submit
      </Button>
    </Form>
  );
}

export default CreateRoom;
