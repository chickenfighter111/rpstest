import {Container, Col} from "react-bootstrap";
import WidgetBot from "@widgetbot/react-embed";


const DiscordChat = () => {
    return (
      <Col className="discordChat">
        <Container className="discord_chat_container">
          <WidgetBot
            server="1002944553050968215"
            channel="1002949643077963857"
            height="80vh"
            width='20vw'
          />
        </Container>
      </Col>
    );
  }

  export default DiscordChat;