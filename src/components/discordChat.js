import {Container, Col, Button} from "react-bootstrap";
import WidgetBot from "@widgetbot/react-embed";
import React, { useState } from "react";
import styled from "styled-components"

const StartBtn = styled(Button)`
  width: 150px;
  height: 45px;
  font-size: 25px;
  margin-bottom: 10px;
`


const DiscordChat = () => {
  const [hide, setHide] = useState(false);
  
  const hideShow = async () =>{
    if(hide) setHide(false)
    else setHide(true)
   }

    return (
      <Col className="discordChat">
        <Container className="discord_chat_container">
        {hide ? (<StartBtn onClick={hideShow}>Show chat</StartBtn>) 
              :  (<div>
                <StartBtn  onClick={hideShow}>Hide chat</StartBtn>
                <WidgetBot
                  server="1002944553050968215"
                  channel="1002949643077963857"
                  height="80vh"
                  width='20vw'
                />
              </div>)}
        </Container>
      </Col>
    );
  }

  export default DiscordChat;