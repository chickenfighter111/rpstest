import React, { useState, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Moralis from "moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import {AnchorProvider,Program,utils,web3} from "@project-serum/anchor";

import { useParams, useNavigate } from "react-router-dom";
import base58 from 'bs58'

const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../rps_project.json");
const utf8 = utils.bytes.utf8;

function CreateRoom(props) {
  const [amount, setAmount] = useState(0.1);
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

  const set_amount = async (event) => {
    event.preventDefault();
    if (amount >= 0.1) {
      createRoom(); //works
    }
    else alert("Minimum value is 0.1 SOL")
  };

  async function createRoom() {
    //game room
    const [roomPDA, _] = await web3.PublicKey.findProgramAddress([
      utf8.encode("rps_room_escrow_wallet"), publicKey.toBuffer()
    ], program.programId);

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
        const roomKP =  web3.Keypair.generate()
        const sk = roomKP.secretKey;
        const pk = roomKP.publicKey;
        var b64 = Buffer.from(sk).toString('base64');
        var b58 = pk.toBase58();
        const user = Moralis.User.current();
        const owner = user.getUsername();
        const paramz = {
          owner: owner,
          bet: Number(amount),
          room_name: name,
          room_pda: b58,
          rk: b64
        }
        const aRoomObj = await Moralis.Cloud.run("createRoom", paramz)
        user.set("is_playing", true);
        user.set("in_room", aRoomObj);
        await user.save();
    
        navigateToRoom(aRoomObj);
      }
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
          min={0}
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
          required
        />
      </Form.Group>
      <Button variant="primary" type="submit" onClick={set_amount}>
        Submit
      </Button>
    </Form>
  );
}

export default CreateRoom;
