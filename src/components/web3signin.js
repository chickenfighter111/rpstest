import React, { useEffect, useState, useMemo } from "react";
import { Web3AuthCore } from "@web3auth/core";
import {
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
//import RPC from "./solanaRPC";
import "../App.css";
import { useMoralis } from "react-moralis";
import Moralis from "moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import {Navbar,Button,Dropdown,Badge,Container,Row,Col, Modal} from "react-bootstrap";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

import CreatePlayerWallet from "./createPlayerWallet";
import PlayerWalletManager from "./instructions/managePlayerWallet";

import * as anchor from "@project-serum/anchor";
import {AnchorProvider, web3, utils, Program,} from "@project-serum/anchor";
import styled from 'styled-components'
import Buffer from 'buffer'

import {OpenloginAdapter} from '@web3auth/openlogin-adapter'

import {AiTwotoneSetting} from 'react-icons/ai'
import logo from "./media/logg2.png"
import sol from "./media/solc.png"


const StartBtn = styled(Dropdown.Toggle)`
  width: 250px;
  height: 45px;
  font-size: 25px;
`


const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../rps_project.json");
const one_sol = 1_000_000_000;

//const clientId = 'BBP_6GOu3EJGGws9yd8wY_xFT0jZIWmiLMpqrEMx36jlM61K9XRnNLnnvEtGpF-RhXJDGMJjL-I-wTi13RcBBOo'
const clientId =  process.env.REACT_APP_WEB3_CLIENT_ID | "BGUYFB-xTJdSGPtMI92VdT-tFwmijpKvTGnDd-398H37Dy4alqnvb9QPR5PunNT5vBShifRYYz8cAFHSjhKltnI"; // get from https://dashboard.web3auth.io.

const MyNavbar = (props) => {
  const [balance, setBalance] = useState(props.bal);

  const { logout, isAuthenticated, authenticate } = useMoralis();
  const { connected, publicKey, wallet, disconnect } = useWallet();
  const [playerModalShow, setplayerModal] = useState(false);

  const [registered, setRegister] = useState(false);
  const [web3auth, setWeb3auth] = useState(null);
  const [provider, setProvider] = useState(null);
  const [hasWallet, setHasWallet] = useState(false)
  const [adapter, setAdapter] = useState(null);


  //Moralis
  const connectPhantomWallet = async () => {
    try {
      await authenticate({
        signingMessage: "Register",
        type: "sol",
      })
    } catch (err) {
    }
  };

  
  useEffect(() => {
    const getBalance = async () => {
      const connection = new web3.Connection(network, "processed");
      const aprovider = new AnchorProvider(connection, wallet, {preflightCommitment: "processed",});
      const program = new Program(idl, idl.metadata.address, aprovider);
      const utf8 = utils.bytes.utf8;
  
      const aUser = Moralis.User.current();
      const playerPDA = aUser.get("player_wallet");
      if (playerPDA) {
        const escrow = new anchor.web3.PublicKey(playerPDA)
        try {
          let abalance = await aprovider.connection.getBalance(escrow); //player escrow
          props.onChangeBalance(Math.round((abalance / one_sol)  * 100) / 100);
          setBalance(Math.round((abalance / one_sol)  * 100) / 100);

        } catch (err) {
        }
      }
    };

    const fetchPlayerWallet = async() =>{
      const playerWallet = Moralis.User.current().get("player_wallet");
      if (playerWallet) setHasWallet(true)
      else setHasWallet(false)

    }

    if (connected && isAuthenticated) {
      getBalance();
      fetchPlayerWallet()
    }

  }, [connected, isAuthenticated]);

  useEffect(() => {
    const init = async () => {
      try {

        const web3auth2 = new Web3AuthCore({
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.SOLANA,
            chainId: "0x3", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
            rpcTarget: network, // This is the public RPC we have added, please pass on your own endpoint while creating an app
          },
        });

        const openloginAdapter2 = new OpenloginAdapter({
          adapterSettings: {
            clientId: "BGUYFB-xTJdSGPtMI92VdT-tFwmijpKvTGnDd-398H37Dy4alqnvb9QPR5PunNT5vBShifRYYz8cAFHSjhKltnI",
            network: 'testnet',
            uxMode: 'popup',
            loginConfig: {
              discord: {
                name: 'RpsAuth',
                verifier: 'discord-verif',
                typeOfLogin: 'discord',
                clientId: '1010130538662744114', //use your app client id you got from discord
              },
            },
          },
        })

        web3auth2.configureAdapter(openloginAdapter2);
        setWeb3auth(web3auth2);
        setAdapter(openloginAdapter2)

        await web3auth2.init();
        if (web3auth2.provider) {
          setProvider(web3auth2.provider);
        }
      } catch (error) {
        }
    };

    init();
  }, []);

  useEffect(() => {
    const registerUser = async () => {
      //no need to check if user exists as it registers at first Moralis Auth
      const userInfo = await getUserInfo();
      //we found the user signed in via Web3Auth
      const aUser = Moralis.User.current();
      if (userInfo) {
        if (userInfo.aggregateVerifier === "discord-verif") {
          aUser.setUsername(userInfo.name);
          try {
            await aUser.save();
            await logout(); //moralis logout
            setRegister(false);
            //revokeToken(userInfo.oAuthAccessToken)
            await web3logout();
            alert("Succes, you can now connect with your wallet!");
          } catch (err) {
            alert("Signin error" );
          }
        }
      }
    };

    const revokeToken = async (token) =>{
      const axios = require("axios").default;
      const FormData = require("form-data");
      const userInfo = await getUserInfo();


      const { REACT_APP_DISCORD_CLIENT_SECRET, DISCORD_CLIENT_ID } = process.env;
      const formData = new FormData();
      formData.append("token", token);
      await axios.post("https://discord.com/api/oauth2/token/revoke", formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Basic ${Buffer.from(`${DISCORD_CLIENT_ID}:${REACT_APP_DISCORD_CLIENT_SECRET}`, "binary").toString("base64")}`,
        },
      }); 
    }

    if (isAuthenticated && registered){
      registerUser(); //register the web3atuh user to Moralis DB
    }
  }, [isAuthenticated, web3auth]);

  const getAccounts = async () => {
    if (!provider) {
      alert("provider not initialized yet");
      return;
    }
    //const rpc = new RPC(provider);
    //const address = await rpc.getAccounts();
   // return address[0];
  };

  const login = async () => {
    if (!web3auth) {
      alert("web3auth not initialized yet");
      return;
    }
    try {
      await connectPhantomWallet()
      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        {
          loginProvider: 'discord',
        },
      )
      setRegister(true)
      setProvider(web3authProvider)
    } catch (err) {
      //console.log(err)
    }
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      return;
    }
    const user = await web3auth.getUserInfo();
    return user;
  };

  const web3logout = async () => {
    if (web3auth) {
      setProvider(null);
      setRegister(false);
      web3auth.logout();
    }
    if (connected) await disconnect()
    await logout();
  };

  useEffect(() => {
    if (!isAuthenticated && connected) connectPhantomWallet();
  }, [connected]);



  function CreatePlayerModal(props) {
    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Create player wallet
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreatePlayerWallet />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Navbar bg="dark" expand="lg">
      <Container className="roomContainer">
        <Navbar.Brand className="burando" href="/">
          <span>
            <h1>
              {" "}
              <img src={logo} width={60} height={50} /> Asaka Games{" "}
            </h1>
          </span>

          <Badge className="abadge" bg="secondary">
            Beta
          </Badge>
        </Navbar.Brand>
        {connected && isAuthenticated ? (
          <Row>
            <Col>
              <Dropdown>
                <StartBtn>
                  Wallet: {balance}
                  <img src={sol} width={30} height={25} alt="SOL" />{" "}
                  <AiTwotoneSetting style={{position: "relative", left: "20px"}} size={25} />
                </StartBtn>

                <Dropdown.Menu>
                  <Dropdown.Item className="walletmanager">
                    <PlayerWalletManager
                      balance={balance}
                      setBal={setBalance}
                    />
                  </Dropdown.Item>
                  {!hasWallet ? (
                    <Dropdown.Item onClick={() => setplayerModal(true)}>
                      Player Wallet
                    </Dropdown.Item>
                  ) : (
                    <div></div>
                  )}
                  <Dropdown.Item onClick={web3logout}>Log Out</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <CreatePlayerModal
              show={playerModalShow}
              onHide={() => setplayerModal(false)}
            />
          </Row>
        ) : (
          <Row>
            <Col md="auto">
              <WalletMultiButton className="navBtn" />
            </Col>
            <Col>
              <Button onClick={login}>Sign-in</Button>
            </Col>
          </Row>
        )}
      </Container>
    </Navbar>
  );
};

export default MyNavbar;
