import React, {  useState} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Moralis  from 'moralis'


function Signup() {
    const [username, setUsername] = useState("");


  const setusername = async (event) => {
    event.preventDefault();
    const aUser =  Moralis.User.current();
    if (aUser){
        aUser.set("username", username);
        try{
            await aUser.save().then(()=> alert("Username updated succesfully to " + username))
        }
        catch(err){
            alert("Signup error: " + err.message)
        }
    }
}


  const handleInput = (event) => {
    setUsername(event.target.value);
}

    return (
      <Form >
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Username</Form.Label>
          <Form.Control required type="username" value={username} placeholder="Enter username" onChange={handleInput} />
          <Form.Text className="text-muted">
              Your in-game username
          </Form.Text>
        </Form.Group>
        <Button variant="primary" type="submit" onClick={setusername}>
          Submit
        </Button>
      </Form>
    );
}

export default(Signup)