import React, { useEffect, useState, useMemo } from "react";
import { Web3Auth } from "@web3auth/web3auth";
import {
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
//import RPC from "./solanaRPC";
import "../App.css";
import { useMoralis } from "react-moralis";
import Moralis from "moralis";
import { PhantomAdapter } from "@web3auth/phantom-adapter";
import { useWallet } from "@solana/wallet-adapter-react";
import {Navbar,Button,Dropdown,Nav,Container,Row,Col, Modal} from "react-bootstrap";
import {WalletDisconnectButton,WalletMultiButton} from "@solana/wallet-adapter-react-ui";

import ModifyUsername from "./signup";
import CreatePlayerWallet from "./createPlayerWallet";
import PlayerWalletManager from "./instructions/managePlayerWallet";

import * as anchor from "@project-serum/anchor";
import {AnchorProvider, web3, utils, Program,} from "@project-serum/anchor";
import {AiFillSound, AiOutlineSound} from "react-icons/ai"

import {Cog} from '@web3uikit/icons'
import logo from "./media/logg2.png"

const network = "https://devnet.genesysgo.net/"; //devnet
const idl = require("../rps_project.json");
const one_sol = 1_000_000_000;

const clientId = process.env.REACT_APP_WEB3_CLIENT_ID; // get from https://dashboard.web3auth.io.

const MyNavbar = (props) => {
  const [balance, setBalance] = useState(null);

  const { logout, isAuthenticated, authenticate } = useMoralis();
  const { connected, publicKey, wallet, disconnect } = useWallet();
  const [modalShow, setModalShow] = useState(false);
  const [playerModalShow, setplayerModal] = useState(false);

  const [registered, setRegister] = useState(false);
  const [web3auth, setWeb3auth] = useState(null);
  const [provider, setProvider] = useState(null);
  const [soundState, setSoundState] = useState(false);


  //Moralis
  const connectPhantomWallet = async () => {
    try {
      await authenticate({
        signingMessage: "Log in",
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
        const [escrowPda, _] = await anchor.web3.PublicKey.findProgramAddress(
          [utf8.encode('player_escrow_wallet'), publicKey.toBuffer()],
          program.programId
        );
        try {
          let abalance = await aprovider.connection.getBalance(escrowPda); //player escrow
          setBalance(Math.round((abalance / one_sol)  * 100) / 100);
        } catch (err) {
        }
      }
    };

    if (connected && isAuthenticated) {
      getBalance();
    }
  }, [connected, isAuthenticated]);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.SOLANA,
            chainId: "0x1", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
            rpcTarget: "https://rpc.ankr.com/solana", // This is the public RPC we have added, please pass on your own endpoint while creating an app
          },
          uiConfig: {
            theme: "dark",
            loginMethodsOrder: ["discord", "twitter", "google", "reddit"],
          },
        });

        setWeb3auth(web3auth);
        const phantomAdapter = new PhantomAdapter();
        web3auth.configureAdapter(phantomAdapter);

        await web3auth.initModal();
        if (web3auth.provider) {
          setProvider(web3auth.provider);
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
        if (userInfo.aggregateVerifier == "tkey-discord") {
          aUser.setUsername(userInfo.name);
          try {
            await aUser.save();
            await logout(); //moralis logout
            setRegister(false);
            await web3logout();
            alert("Succes ");
          } catch (err) {
            alert("Signin error: " + err.message);
          }
        }
      }
    };

    if (registered && isAuthenticated && !connected) {
      const sk = getPrivateKey();
      alert(`Save that secret key somewhere! Don't share with anyone! ${sk}`);
      registerUser(); //register the web3atuh user to Moralis DB
    }
  }, [isAuthenticated, registered, connected]);

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
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setRegister(true);
    } catch (err) {}
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

  const getPrivateKey = async () => {
    if (!provider) {
      return;
    }
   // const rpc = new RPC(provider);
   // const privateKey = await rpc.getPrivateKey();
  //  return privateKey;
  };

  useEffect(() => {
    props.setSound(soundState);
  }, [props.setSound, soundState]);

  useEffect(() => {
    if (!isAuthenticated && connected) connectPhantomWallet();
  }, [connected]);

  useEffect(() => {
    if (registered) {
      connectPhantomWallet(); //connect to DB once registered
    }
  }, [registered]);

  function MyVerticallyCenteredModal(props) {
    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Change username
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ModifyUsername />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

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
      <Container>
        <Navbar.Brand className="burando" href="/">
         
          <h1>  <img src={logo} width={60} height={50} /> Asaka Games </h1>
       
        </Navbar.Brand>
        {connected && isAuthenticated ? (
          <Row >
            <Col>
              {soundState ? 
              (<Button onClick={(() => setSoundState(false))}><AiFillSound/></Button>) : 
              (<Button onClick={(() => setSoundState(true))}><AiOutlineSound/></Button>)}
            </Col>
            <Col>
              <Dropdown>
                <Dropdown.Toggle className="navBtn" >
                  Wallet: {balance} SOL <Cog fontSize='15px'/>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item>
                    <Container>
                    <Button 
                      onClick={() => {
                        setModalShow(true);
                      }}
                    >
                      Settings
                    </Button>
                    </Container>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    
                    <PlayerWalletManager />
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <Container>
                    <Button onClick={() => setplayerModal(true)}>
                      PlayerWallet
                    </Button>
                    </Container>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md="auto">
              <WalletDisconnectButton className="navBtn" onClick={web3logout}>
                Log Out
              </WalletDisconnectButton>
            </Col>
            <CreatePlayerModal
              show={playerModalShow}
              onHide={() => setplayerModal(false)}
            />
            <MyVerticallyCenteredModal
              show={modalShow}
              onHide={() => setModalShow(false)}
            />
          </Row>
        ) : (
          <Row>
            <Col md="auto">
              <WalletMultiButton className="navBtn"/>
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
