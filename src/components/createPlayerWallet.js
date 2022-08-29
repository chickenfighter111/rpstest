import React, { useState, useEffect, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Moralis from "moralis";
import { useMoralis } from "react-moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, utils, web3 } from "@project-serum/anchor";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import Buffer from 'buffer'


const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../rps_project.json");
const utf8 = utils.bytes.utf8;

function PlayerWallet() {
  const { isAuthenticated } = useMoralis();
  const [username, setUsername] = useState("");
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

  const createPlayerWallet = async (username) => {
    const connection = new web3.Connection(network, "processed");
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);
    const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('a_player_escrow_wallet'), publicKey.toBuffer()],
      program.programId
    );
    try {
      await program.account.player.fetch(escrowPda);
      
    } catch (err) {
      try{
        await program.methods.initEscrow(escrowBump)
      .accounts({
        owner: publicKey,
        anAccount: escrowPda,
        systemProgram: anchor.web3.SystemProgram.programId
      }).rpc()
      }
      catch(err){
        alert("problem in init " + err)
      }
      const aUser = Moralis.User.current();
      aUser.set("player_wallet", escrowPda.toBase58());
      try {
        await aUser.save().then(() => alert("Player wallet created!"));
      } catch (err) {
        alert("Signup error: " + err.message);
      }
    }
  };

  const createWallet = async (event) => {
    event.preventDefault();
    if (username) {
      await create_player_wallet().then(() => {
        alert("Player wallet created!")
        window.location.reload()
      })

    }
  };


  const generateWallet = async () =>{
    function _arrayBufferToBase64( buffer ) {
        var binary = '';
        var bytes = new Uint8Array( buffer );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

    function _base64ToArrayBuffer(base64) {
      var binary_string = window.atob(base64);
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }

    const aKP = Keypair.generate()
    var b58Public = aKP.publicKey.toBase58();
    var b64 = aKP.secretKey.buffer
    const b64encoded = _arrayBufferToBase64(b64)
    return [b58Public,b64encoded]
  }

  const sendSecretTransac = async () =>{    
    function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

    const arraybuf = _base64ToArrayBuffer("ynVYDIOFFtBTp9IF8vlIuCS2n2xkNnvLWJcOhQAJPTkdjTkGnZMBl8La7ic0YYjUh4XDh+MsNDzm7/IFIl0sYQ==")
    const u8int= new Uint8Array(arraybuf)

    const fromWallet = Keypair.fromSecretKey(u8int)

    try{
      const network = "https://devnet.genesysgo.net/"; //devnet
      let connection = new Connection(clusterApiUrl('devnet'), 'processed');

      const to = new PublicKey("3b4Y9EGxYWsHvTYmdpSQQUqpsP7R5LqMruZjEA4na3qU")
      let tx = new anchor.web3.Transaction().add(anchor.web3.SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: to,
        lamports: LAMPORTS_PER_SOL*2,
    }))
    const confirmedTx = await sendAndConfirmTransaction(connection, tx, [fromWallet]);
   // console.log(tx)
    //console.log("Confirmed Tx ", confirmedTx)
    }
    catch(err){
    //  console.log(err)
    } 
  }

  const create_player_wallet = async () =>{
    const aKp_string = await generateWallet()
    const currentUser =  Moralis.User.current()
    currentUser.set("username", username);
    currentUser.set("player_wallet", aKp_string[0]);
    await currentUser.save()
    
    const Wallet = Moralis.Object.extend("Wallet");
    const aWallet = new Wallet();
    aWallet.set("address", aKp_string[0])
    aWallet.set("key", aKp_string[1])
    aWallet.set("owner", Moralis.User.current().id)
    aWallet.setACL(new Moralis.ACL(Moralis.User.current()));
    await aWallet.save() 
  }

  const handleInput = (event) => {
    setUsername(event.target.value);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const aUser = Moralis.User.current();
      const someUser = aUser.getUsername();
      setUsername(someUser);
    }
  }, [isAuthenticated]);

  return (
    <Form>
      <Form.Group className="mb-3" 
          placeholder="Enter username">
        <Form.Label>Username</Form.Label>
        <Form.Control
          required
          type="text"
          value={username}
          onChange={handleInput}
        />
        <Form.Text className="text-muted">Your in-game username</Form.Text>
      </Form.Group>
      <Button variant="primary" type="submit" onClick={createWallet}>
        Submit
      </Button>
    </Form>
  );
}

export default PlayerWallet;
