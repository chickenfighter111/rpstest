import {
  AnchorProvider,
  Program,
  utils,
  web3,
  BN,
} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import React, { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Moralis from "moralis";
import { useMoralis } from "react-moralis";
import { Button, Modal, Form, Container, Dropdown } from "react-bootstrap";


const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../../rps_project.json");
const utf8 = utils.bytes.utf8;
const one_sol = 1_000_000_000;

function WalletManager() {
  const [balance, setBalance] = useState(null);

  const [modalShow, setModalShow] = useState(false);
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

  function DepositForm() {
    const [amount, setAmount] = useState(0);

    const deposit = async (event) => {
      event.preventDefault();
      const aUser = Moralis.User.current();
      const playerPDA = aUser.get("player_wallet");
      if (playerPDA) {
        const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
          [utf8.encode('player_escrow_wallet'),publicKey.toBuffer()],
          program.programId
        );
        try {
          /*const dtx = await program.methods
            .depositToEscrow(new BN(amount * one_sol))
            .accounts({pda: escrowPda,
              owner: publicKey,
              dataAccount: aPlayerPDA, //contains data of player
              systemProgram: anchor.web3.SystemProgram.programId,
            }).rpc(); */

          const adtx = await program.methods.depow(new BN(amount*one_sol))
            .accounts({
              lockAccount: escrowPda,
              owner: publicKey
            }).rpc()  
          await getBalance();//refresh
        } catch (err) {
        }
      }
    };

    const withdraw = async (event) => {
        event.preventDefault();
        const aUser = Moralis.User.current();
        const playerPDA = aUser.get("player_wallet");
        if (playerPDA) {
          const aPlayerPDA = new web3.PublicKey(playerPDA);
          const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
            [utf8.encode('player_escrow_wallet'),publicKey.toBuffer()],
            program.programId
          );
          try {
            const wtx = await program.methods.widro(new BN(amount*one_sol))
            .accounts({
              lockAccount: escrowPda,
              owner: publicKey
            }).rpc()  
            await getBalance(); //refresh
          } catch (err) {
          }
        }
      };

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
          Deposit
        </Button>
        <Button variant="primary" type="submit" onClick={withdraw}>
          Withdraw
        </Button>
      </Form>
    );
  }

  const getBalance = async () => {
    const aUser = Moralis.User.current();
    const playerPDA = aUser.get("player_wallet");
    if (playerPDA) {
      const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode('player_escrow_wallet'), publicKey.toBuffer()],
        program.programId
      );
      try {
        let balance = await provider.connection.getBalance(escrowPda); //player escrow
        setBalance(Math.round((balance / one_sol)  * 100) / 100);
      } catch (err) {
      }
    }
  };

  useEffect(() => {
    if (connected && isAuthenticated) {
      getBalance();
    }
  }, [connected, isAuthenticated]);

  function DepositModal(props) {
    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Deposit into your wallet
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DepositForm />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <div>
      <Dropdown.Item onClick={() => setModalShow(true)}>Wallet Manager</Dropdown.Item> 
      <DepositModal show={modalShow} onHide={() => setModalShow(false)} />
    </div>
  );
}

export default WalletManager;
