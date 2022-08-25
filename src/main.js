import App from "./App";
import Navbar from "./components/web3signin";
import DiscordChat from "./components/discordChat";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

const Main = () => {
  const [balance, setBalance] = useState(null);

  return (
    <div>
      <Navbar onChangeBalance={setBalance} bal={balance} />
      <Container className="roomContainer">
        <Row>
          <Col xs={3}>
            <div className="chatContainer">
              <DiscordChat />
            </div>
          </Col>
          <Col >
            <App onChangeBalance={setBalance} bal={balance} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Main;
