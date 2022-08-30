import App from "./App";
import Navbar from "./components/web3signin";
import DiscordChat from "./components/discordChat";
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { useWallet } from "@solana/wallet-adapter-react";
import styled from 'styled-components'

const DarkApp = styled(App)`
  background-color: #051a48
  color: #ffffff
`

const Main = () => {
  const [balance, setBalance] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { isAuthenticated } = useMoralis();
  const { connected } = useWallet();

  return (
    <div>
      <Navbar darkmode={darkMode} darkModeChanger={setDarkMode} onChangeBalance={setBalance} bal={balance} />
      <Container className="roomContainer">
        <Row>
          <Col xs={3}>
            {isAuthenticated && connected ? (<div className="chatContainer">
            <DiscordChat />
            </div>) : (<div></div>)}
          </Col>
          <Col >
            {darkMode ? ( <DarkApp darkmode={darkMode} onChangeBalance={setBalance} bal={balance} />) 
            : (<App darkmode={darkMode} onChangeBalance={setBalance} bal={balance} />)}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Main;
