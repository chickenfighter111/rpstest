import App from "./App";
import Navbar from "./components/web3signin";
import DiscordChat from "./components/discordChat";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useMoralis } from "react-moralis";
import { useWallet } from "@solana/wallet-adapter-react";

const Main = () => {
  const [balance, setBalance] = useState(null);
  const { isAuthenticated } = useMoralis();
  const { connected } = useWallet();

  const handleBalanceChange = React.useCallback((newValue) => {
    setBalance(newValue);
 }, []);

  return (
    <div>
      <Navbar onChangeBalance={handleBalanceChange} bal={balance} />
      <Container className="roomContainer">
        <Row>
          <Col xs={3}>
            {isAuthenticated && connected ? (<div className="chatContainer">
              <DiscordChat />
            </div>) : (<div></div>)}
          </Col>
          <Col >
            <App onChangeBalance={handleBalanceChange} bal={balance} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Main;
