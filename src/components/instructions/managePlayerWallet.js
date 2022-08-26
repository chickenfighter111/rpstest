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
import ModifyUsername from './forms/signup';
import { LAMPORTS_PER_SOL, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";


const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../../rps_project.json");
const utf8 = utils.bytes.utf8;
const one_sol = 1_000_000_000;

function WalletManager(props) {

  const [modalShow, setModalShow] = useState(false);
  const { isAuthenticated } = useMoralis();
  const { wallet, publicKey, signTransaction, signAllTransactions, connected } = useWallet();
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
        const escrow = new anchor.web3.PublicKey(playerPDA)
        try {
          const tx = await program.methods.depozit(new BN(amount*one_sol))
            .accounts({
              from: publicKey,
              escrowAcc: escrow
            }).rpc()  
           // console.log(tx)
          await getBalance();//refresh
        } catch (err) {
         // console.log(err)
        }
        
      }
    };

    const withdraw = async (event) => {
      async function _base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
     }

        event.preventDefault();
        const aUser = Moralis.User.current();
        const playerPDA = aUser.get("player_wallet");
        if (playerPDA) {
          try {
            const walletQry = new Moralis.Query("Wallet")
            walletQry.equalTo("owner", aUser.id)
            const aWallet = await walletQry.first()
            //console.log(aWallet)
            const escrow = new anchor.web3.PublicKey(playerPDA)
            const arraybuf = await _base64ToArrayBuffer(aWallet.get("key"))
            const u8int= new Uint8Array(arraybuf)
            const escrowWallet = Keypair.fromSecretKey(u8int)
            const wTx = await program.methods.widrawl(new BN(LAMPORTS_PER_SOL*amount-(0.00001*LAMPORTS_PER_SOL)))
            .accounts({
              escrowAcc: escrowWallet.publicKey,
              toMe: publicKey
            }).transaction()
            const aConnection = new web3.Connection(network, 'finalized');
            wTx.feePayer = escrowWallet.publicKey;
            wTx.recentBlockhash = await aConnection.getLatestBlockhash('finalized').blockhash;
            //const signedTx = wTx.sign([escrowWallet])
            await sendAndConfirmTransaction(connection, wTx, [escrowWallet]);
            await getBalance(); //refresh
          } catch (err) {
           // console.log(err)
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
      const escrow = new anchor.web3.PublicKey(playerPDA)
      try {
        const balance = await provider.connection.getBalance(escrow); //player escrow
        props.onChangeBalance(Math.round((balance / one_sol)  * 100) / 100);
      } catch (err) {
      }
    }
  };

  useEffect(() => {
    if (connected && isAuthenticated) {
      //props.setBal(balance)
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
          <ModifyUsername />
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
