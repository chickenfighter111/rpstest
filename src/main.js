import App from "./App";
import Navbar from "./components/web3signin";
import DiscordChat from "./components/discordChat";
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import styled from 'styled-components'

const DarkApp = styled(Container)`
  background-color: #051a48
  color: #ffffff
`

const DarkNav= styled(Navbar)`
  background-color: #051a48
  color: #ffffff
`

const Main = () => {
  const [balance, setBalance] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [soundState, setSoundState] = useState(true)

  const { isAuthenticated } = useMoralis();
  const { connected } = useWallet();

  return (
    <div className={darkMode ? "Dark-App" : "App"}>
      <Navbar darkmode={darkMode} darkModeChanger={setDarkMode} onChangeBalance={setBalance} bal={balance} soundState={soundState} setSound={setSoundState}/>
      <DarkApp className="mainContainer">
        <Row>
          <Col xs={3}>
            {isAuthenticated && connected ? (<div className="chatContainer">
            <DiscordChat />
            </div>) : (<div></div>)}
          </Col>
          <Col >
           <App darkmode={darkMode} onChangeBalance={setBalance} bal={balance} soundState={soundState}/>
          </Col>
        </Row>
      </DarkApp>
    </div>
  );
};

export default Main;
