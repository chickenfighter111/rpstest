import React, {  useState} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Moralis  from 'moralis'
import styled from 'styled-components'

const FormButton = styled(Button)`
  border-radius: 20px;
  margin-bottom: 30px;
`

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
          <Form.Label>Change username</Form.Label>
          <Form.Control required type="username" value={username} placeholder="Enter username" onChange={handleInput} />
          <Form.Text className="text-muted">
              Your in-game username
          </Form.Text>
        </Form.Group>
        <FormButton variant="primary" type="submit" onClick={setusername}>
          Update
        </FormButton>
      </Form>
    );
}

export default(Signup)