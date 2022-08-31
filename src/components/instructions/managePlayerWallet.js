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
import { Button, Modal, Form, Dropdown } from "react-bootstrap";
import ModifyUsername from './forms/signup';
import { LAMPORTS_PER_SOL, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

import CreatePlayerWallet from "./createPlayerWallet";

import {network, idl} from '../../rpc_config'

import dustLogo from '../media/DUST.jpg'
import forgeLogo from '../media/FORGE.png'
import sol from '../media/sol.png'
import styled from 'styled-components'

const StyledInput = styled(Form.Control)`
  margin-top: 10px;
  width: 100px;
`

const StyledSelect = styled(Form.Select)`
  margin-top: 10px;
  width: 100px;
`

const FormButton = styled(Button)`
  border-radius: 20px;
  margin-right: 10px;
  margin-bottom: 30px;
`

const dustContract = "DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ"
const forgeContract = "FoRGERiW7odcCBGU1bztZi16osPBHjxharvDathL5eds"

const utf8 = utils.bytes.utf8;
const one_sol = 1_000_000_000;

function WalletManager(props) {
  const [hasWallet, setHasWallet] = useState(false)
  const [dbalance, setDBalance] = useState(props.dbalance);
  const [fbalance, setFBalance] = useState(props.fbalance);

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
    const [amount, setAmount] = useState(0.1);

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
       //  console.log(err)
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
            const sig = await sendAndConfirmTransaction(connection, wTx, [escrowWallet]);
          //  console.log(sig)
            await getBalance(); //refresh
          } catch (err) {
       //     console.log(err)
          }
        }
    };

    const handleInput = (event) => {
      setAmount(event.target.value);
    };

    return (
      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label> Deposit/Withdraw <img src={sol} width={25} height={25} alt="$SOL"/></Form.Label>
          <StyledInput
            required
            type="number"
            value={amount}
            min={0.1}
            placeholder="Enter amount to deposit"
            onChange={handleInput}
          />
          <Form.Text className="text-muted">Your deposit</Form.Text>
        </Form.Group>
        <FormButton variant="primary" type="submit" onClick={deposit}>
          Deposit
        </FormButton>
        <FormButton variant="primary" type="submit" onClick={withdraw}>
          Withdraw
        </FormButton>
      </Form>
    );
  }

  function SplForm() {
    const [amount, setAmount] = useState(0);
    const [contract, setContract] = useState("92HcuoTGqPyNjgLKuX5nQnaZzunbY9jSbxb6h7nZKWQy");

    const depositSPL = async (event) => {
      event.preventDefault();
      const aUser = Moralis.User.current();
      const playerPDA = aUser.get("player_wallet");
      if (playerPDA) {
        const escrow = new anchor.web3.PublicKey(playerPDA)
        const mint = new anchor.web3.PublicKey(contract)

        try {

          let associatedTokenAccount = await getAssociatedTokenAddress(
            mint,
            anchorWallet.publicKey
          );
          let toATA;

          try{
            toATA = (await getOrCreateAssociatedTokenAccount(
              connection,
              anchorWallet.publicKey,
              mint, //mint pk
              escrow //to pk
            )).address;
          }
          catch(err){
            alert("First SPL deposit, we need configure your account...")
            toATA = await getAssociatedTokenAddress(
              mint, //mint pk
              escrow //to pk
            );
            try{const mint_tx = new anchor.web3.Transaction().add(
              createAssociatedTokenAccountInstruction(
                anchorWallet.publicKey, toATA, escrow, mint
              )
            );
            await provider.sendAndConfirm(mint_tx, [])
          }catch(err){}
          }
          const tx = await program.methods.transferPforge(new BN(amount*LAMPORTS_PER_SOL)).accounts({
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMint: mint,
            from: associatedTokenAccount,
            fromAuthority: anchorWallet.publicKey,
            to: toATA,
          }).rpc(); 
          const balance = (await program.provider.connection.getParsedAccountInfo(toATA)).value.data.parsed.info.tokenAmount.amount;
          //console.log("escrow balance ", balance/LAMPORTS_PER_SOL)
            //console.log(tx)
            const bal = (await program.provider.connection.getParsedAccountInfo(toATA)).value.data.parsed.info.tokenAmount.amount;
            props.fonChangeBalance(Math.round((bal/LAMPORTS_PER_SOL)).toPrecision(4))
        } catch (err) {
        // console.log(err)
        }
      }
    };

    const withDrawSPL = async (event) => {
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
        const escrow = new anchor.web3.PublicKey(playerPDA)
        const mint = new anchor.web3.PublicKey(contract)

        try {
          let escrowATA = await getAssociatedTokenAddress(
            mint, //mint pk
            escrow //to pk
          );
          let ATA = await getAssociatedTokenAddress(
            mint,
            anchorWallet.publicKey
          );
          const walletQry = new Moralis.Query("Wallet")
          walletQry.equalTo("owner", aUser.id)
          const aWallet = await walletQry.first()
          if(aWallet){
            const arraybuf = await _base64ToArrayBuffer(aWallet.get("key"))
            const u8int= new Uint8Array(arraybuf)
            const escrowWallet = Keypair.fromSecretKey(u8int)
  
            const tx = await program.methods.transferPforge(new BN(amount*LAMPORTS_PER_SOL)).accounts({
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMint: mint,
              from: escrowATA,
              fromAuthority: escrowWallet.publicKey,
              to: ATA,
            }).signers([escrowWallet]).rpc(); 
              //console.log(tx)
              const bal = (await program.provider.connection.getParsedAccountInfo(escrowATA)).value.data.parsed.info.tokenAmount.amount;
              props.fonChangeBalance(Math.round((bal/LAMPORTS_PER_SOL)).toPrecision(4))
          }
        } catch (err) {
        //  console.log(err)
        }
      }
    };

    const handleInput = (event) => {
      setAmount(event.target.value);
    };

    const handleSelect = (event) => {
      setContract(event.target.value);
      //console.log(event.target.value)
    };

    return (
      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>
            Deposit/Withdraw <img className="logoImg" src={dustLogo} width={25} height={25} alt="$DUST"/> / {" "}
            <img className="logoImg" src={forgeLogo} width={25} height={25} alt="$FORGE"/>

          </Form.Label>
          <StyledInput
            required
            type="number"
            value={amount}
            min={0}
            placeholder="Enter amount to deposit"
            onChange={handleInput}
          />
        <StyledSelect size="lg" aria-label="Default select example" onChange={handleSelect}>
          <option value="92HcuoTGqPyNjgLKuX5nQnaZzunbY9jSbxb6h7nZKWQy">$DUST</option>
          <option value="92HcuoTGqPyNjgLKuX5nQnaZzunbY9jSbxb6h7nZKWQy">$FORGE</option>
        </StyledSelect>
        </Form.Group>
        <FormButton variant="primary" type="submit" onClick={depositSPL}>
          Deposit
        </FormButton>
        <FormButton variant="primary" type="submit" onClick={withDrawSPL}>
          Withdraw
        </FormButton>
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
        //setBalance(Math.round((balance / one_sol)  * 100) / 100)
      } catch (err) {
      }
    }
  };

  const fetchPlayerWallet = async() =>{
    const playerWallet = Moralis.User.current().get("player_wallet");
    if (playerWallet) setHasWallet(true)
    else setHasWallet(false)
  }

  useEffect(() => {
    if (connected && isAuthenticated) {
      //props.setBal(balance)
      getBalance();
      fetchPlayerWallet()
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
            Wallet Manager
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {hasWallet ? 
          (<div>
            <DepositForm />
            <SplForm/>
          </div>) : 
          (<CreatePlayerWallet />)}
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
