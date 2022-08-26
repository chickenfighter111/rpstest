import App from "./App";
import Navbar from "./components/web3signin";
import DiscordChat from "./components/discordChat";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

const Main = () => {
  const [balance, setBalance] = useState(null);

  const handleBalanceChange = React.useCallback((newValue) => {
    setBalance(newValue);
 }, []);

  return (
    <div>
      <Navbar onChangeBalance={handleBalanceChange} bal={balance} />
      <Container className="roomContainer">
        <Row>
          <Col xs={3}>
            <div className="chatContainer">
              <DiscordChat />
            </div>
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
