import React, { useState, useEffect } from "react";
import { ChatFeed, Message } from "react-chat-ui";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import Moralis from "moralis";
import { useMoralis, useNewMoralisObject  } from "react-moralis";
import styled from "styled-components"

const StyledBtn = styled(Button)`
  border-radius: 45px;
`
const users = {
  0: "Me",
  1: "Admin",
  2: "Opponent"
};

function Chat(props) {
  const { isAuthenticated } = useMoralis();
  const [chatId, setChatId] = useState(props.id);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sender, setSnder] = useState(props.sender);

  const newMessage = async (msg) => {
    const Chat = Moralis.Object.extend("Chat");
    const query = new Moralis.Query(Chat);
    query.equalTo("objectId", chatId);
    const aChat = await query.first();
    const Message = Moralis.Object.extend("Message");
    const aMessage = new Message();
    aMessage.set("sender", sender);
    aMessage.set("message", msg);
    aMessage.set("chatRoomId", chatId);
    aMessage.set("parent", aChat)

    aChat.add("messages", aMessage)
    await aChat.save();
  }


  const onMessageSubmit = async (event) => {
    event.preventDefault();
    if (message) {
      newMessage(message);
      pushMessage(sender, message)
      setMessage("");
    }
  };

  const handleInput = (event) => {
    setMessage(event.target.value);
  };

  const pushMessage = async (recipient, message) => {
    const newMessage = new Message({
      id: recipient,
      message,
      senderName: users[0], //sender,
    });
    messages.push(newMessage);
  };

  const receivedmsg = async (recipient, message) => {
    const newMessage = new Message({
      id: recipient,
      message,
      senderName: users[2], //sender,
    });
    messages.push(newMessage);
  };

  useEffect(() => {
    const fetchChatMessages = async () => {
      let newMsgs = [];
      const query = new Moralis.Query("Message");
      query.equalTo("chatRoomId", chatId);
      query.ascending("createdAt");
      const aChat = await query.find();
      if (aChat){
        aChat.map((msgObject) => {
          const asender = msgObject.get("sender");
          if (sender === asender){
            const newMessage = new Message({
              id: sender,
              message: msgObject.get("message"),
              senderName: users[0], //sender,
            });
            newMsgs.push(newMessage);
          }
          else{
            const newMessage = new Message({
              id: asender,
              message: msgObject.get("message"),
              senderName: users[2], //sender,
            });
            newMsgs.push(newMessage);
          }
        });
        setMessages(newMsgs);
      }
    };

    const pingNewMsg = async () => {
      let query = new Moralis.Query("Message");
      query.equalTo("chatRoomId", chatId);
      let subscription = await query.subscribe();
      subscription.on("create", (object) => {
        //console.log("new msg")
        if (sender !== object.get("sender")) receivedmsg(object.get("sender"), object.get("message"));
      });
    };

    if(chatId){
      setSnder(Moralis.User.current().getUsername())
      pingNewMsg();
    }

    if (messages.length === 0) {
      fetchChatMessages();
    }
  }, [messages, chatId, sender, isAuthenticated]);

  return (
    <Container className="chatfeed-wrapper">
      <div >
        <ChatFeed
          maxHeight={250}
          messages={messages} // Boolean: list of message objects
          showSenderName
        />

        <Form onSubmit={onMessageSubmit}>
          <Row className="chatInput">
            <Col xs={9}> <input type="text" className="form-control" value={message} onChange={handleInput}/></Col> 
            <Col><StyledBtn type="submit" onClick={onMessageSubmit}>Send</StyledBtn></Col>
          </Row>
        </Form>
      </div>
    </Container>
  );
}

export default Chat;
