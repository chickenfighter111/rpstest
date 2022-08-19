import React, { useState, useEffect, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Moralis from "moralis";
import { useMoralis } from "react-moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, utils, web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";

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
      [utf8.encode('player_escrow_wallet'), publicKey.toBuffer()],
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
      if (aUser) {
        aUser.set("player_wallet", escrowPda.toBase58());
        try {
          await aUser.save().then(() => alert("Player wallet created!"));
        } catch (err) {
          alert("Signup error: " + err.message);
        }
      }
    }
  };

  const createWallet = async (event) => {
    event.preventDefault();
    if (username) {
      createPlayerWallet(username);
    }
  };

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
