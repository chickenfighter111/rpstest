import { AnchorProvider, Program, utils, web3, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import React, { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Moralis from "moralis";
import { useMoralis } from "react-moralis";
import {Button, Modal, Form} from "react-bootstrap";

const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../../../rps_project.json");
const utf8 = utils.bytes.utf8;

const one_sol = 1_000_000_000;


function DepositForm() {
  const [amount, setAmount] = useState(0);
  const { isAuthenticated } = useMoralis();
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

  const connection = new web3.Connection(network, "processed");
  const provider = new AnchorProvider(connection, anchorWallet, {
    preflightCommitment: "processed",
  });
  const program = new Program(idl, idl.metadata.address, provider);

const deposit =  async (event) => {
    event.preventDefault();
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet")
    if (playerPDA){
        const aPlayerPDA = new web3.PublicKey(playerPDA);
        const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
            [utf8.encode('a_player_escrow'), publicKey.toBuffer()],
            program.programId
          );
        try{
            const dtx = await program.methods.depositToEscrow(new BN(amount*one_sol)).accounts({
                owner: publicKey,
                dataAccount: aPlayerPDA, //contains data of player
                pda: escrowPda, //contains the funds of player(s)
                systemProgram: anchor.web3.SystemProgram.programId
              }).rpc();
        }
        catch(err){
        }
    }
}


  const handleInput = (event) => {
    setAmount(event.target.value);
  };

  return (
    <Form>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label>Amount</Form.Label>
        <Form.Control
          required
          type="amount"
          value={amount}
          placeholder="Enter amount to deposit"
          onChange={handleInput}
        />
        <Form.Text className="text-muted">Your deposit</Form.Text>
      </Form.Group>
      <Button variant="primary" type="submit" onClick={deposit}>
        Submit
      </Button>
    </Form>
  );
}

export default DepositForm;
