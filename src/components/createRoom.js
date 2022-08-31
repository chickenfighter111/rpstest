import React, { useState, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Moralis from "moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import {AnchorProvider,Program,utils,web3} from "@project-serum/anchor";

import { useParams, useNavigate } from "react-router-dom";
import base58 from 'bs58'
import Buffer from 'buffer'
import {network, idl} from '../rpc_config'

import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import styled from 'styled-components'

const StyledSelect = styled(Form.Select)`
  margin-top: 10px;
  width: 120px;
`

const utf8 = utils.bytes.utf8;

function CreateRoom(props) {
  const [amount, setAmount] = useState(0.1);
  const [name, setName] = useState("");
  const [contract, setContract] = useState("SOL");

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
    function _arrayBufferToBase64(buffer) {
      var binary = "";
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }

    //game room
    const roomKP = web3.Keypair.generate();
    const roomPk = roomKP.publicKey;
    let roomATA;

    if(contract === "SOL"){
      var b64 = roomKP.secretKey.buffer;
      const b64encoded = _arrayBufferToBase64(b64);
      var b58 = roomPk.toBase58();
      const user = Moralis.User.current();
      const owner = user.getUsername();
      const paramz = {
        owner: owner,
        bet: Number(amount),
        room_name: name,
        room_pda: b58,
        rk: b64encoded,
        roomAta: null
      };
      const aRoomObj = await Moralis.Cloud.run("createRoom", paramz);
      user.set("is_playing", true);
      user.set("in_room", aRoomObj);
      await user.save();
      navigateToRoom(aRoomObj);
    }
    else{//SOL is the bet
      try { //bet is an SPL
        const mint = new web3.PublicKey(contract);
        roomATA = await getAssociatedTokenAddress(
          mint, //mint pk
          roomPk //to pk
        );
        const mint_tx = new web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            anchorWallet.publicKey,
            roomATA,
            roomPk,
            mint
          )
        );
        await provider.sendAndConfirm(mint_tx, []);
  
        var b64 = roomKP.secretKey.buffer;
        const b64encoded = _arrayBufferToBase64(b64);
        var b58 = roomPk.toBase58();
        const user = Moralis.User.current();
        const owner = user.getUsername();
        const paramz = {
          owner: owner,
          bet: Number(amount),
          room_name: name,
          room_pda: b58,
          rk: b64encoded,
          roomAta: roomATA.toBase58()
        };
        const aRoomObj = await Moralis.Cloud.run("createRoom", paramz);
        user.set("is_playing", true);
        user.set("in_room", aRoomObj);
        await user.save();
    
        navigateToRoom(aRoomObj);
      } catch (err) {
       // console.log(err);
      }
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

  const handleSelect = (event) => {
    setContract(event.target.value);
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
        <StyledSelect size="lg" aria-label="Default select example"  onChange={handleSelect}>
          <option value="SOL">$SOL</option>
          <option value="92HcuoTGqPyNjgLKuX5nQnaZzunbY9jSbxb6h7nZKWQy">$DUST</option>
          <option value="92HcuoTGqPyNjgLKuX5nQnaZzunbY9jSbxb6h7nZKWQy">$FORGE</option>
        </StyledSelect>
        <Form.Text className="text-muted">Bet</Form.Text>
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
