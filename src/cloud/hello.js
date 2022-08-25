Moralis.Cloud.define("helloword", async (request) => {
  return `hello world ${request.params.text}`;
});

Moralis.Cloud.define("getRooms", async (request) => {
  const qry = new Moralis.Query("Room");
  const rooms = qry.find();
  return rooms;
});

Moralis.Cloud.define("getLeaderBoard", async (request) => {
  const qry = new Moralis.Query(Moralis.User);
  const pipeline = [
    { sort: {wins: -1}},
    { limit: 5},
    { project: { username: 1, wins: 1 } }
  ]
  //const users = qry.find();
  return await qry.aggregate(pipeline);
});

Moralis.Cloud.define("getRoomData", async (request) => {
  const qry = new Moralis.Query("Room");
  qry.equalTo("objectId", request.params.roomId);
  const room = qry.first();
  return room;
});

Moralis.Cloud.define("resetRoomState", async (request) => {
  const qry = new Parse.Query("Room");
  qry.equalTo("objectId", request.params.roomId);
  const results = await qry.first();
  results.set("playing", false);
  results.set("playing", false);
  results.save();
});

Moralis.Cloud.define("joinRoom", async (request) => {
  const qry = new Parse.Query("Room");
  qry.equalTo("objectId", request.params.roomId);
  const results = await qry.first();
  const aChallenger = results.get("challenger");
  if (aChallenger === "null") {

    //room open?
    results.set("challenger", request.params.challenger);
    results.save();
    //add 2nd seed to the PDA
    const pdaQry = new Parse.Query("Pda");
    pdaQry.equalTo("room", request.params.roomId);
    const aPda = await pdaQry.first();
    if (aPda){
     if (aPda.get("players").length < 2){
       const randomString = Math.random().toString(36).substring(2,12);
       aPda.addUnique("players", request.params.solAddress);
       aPda.set("random_string", randomString)
       aPda.set("ready", true)
       await aPda.save();
     }
    }

    return false; //was not busy
  } else return true; //busy
});

Moralis.Cloud.define("leaveRoom", async (request) => {
  //const logger = Moralis.Cloud.getLogger();
    //logger.info(results)
  const qry = new Parse.Query("Room");
  qry.equalTo("objectId", request.params.roomId);
  const results = await qry.first(); //room
  const whoIsLeaving = request.params.player;
  const playing = results.get("playing"); //room status
  const aPlayer = results.get("challenger");

  //Pda
  const pdaQry = new Parse.Query("Pda");
  pdaQry.equalTo("room", request.params.roomId);
  const aPda = await pdaQry.first();
  if (!playing) {
    //room open?
    if (results.get("challenger") === "null") {
      results.destroy();
      const aChat = results.get("chat");

      //delete all msg of that chat
      const chatQuery = new Parse.Query("Message");
      chatQuery.equalTo("chatRoomId", aChat.id);
      const chatMsgs = await chatQuery.find();
      chatMsgs.forEach(async (msgObject) => {
        await msgObject.destroy();
      });

      aChat.destroy();
      aPda.destroy();
      return true;
    } else if (whoIsLeaving === results.get("owner")) { //owner is leaving
      results.set("owner", aPlayer);
      results.set("challenger", "null");
      await results.save();

      const ownerSolAddress = aPda.get("players")[0];
      //aPda.remove("players", ownerSolAddress);
      //aPda.set("ready", false)
      //aPda.save()
      return true; //you can leave now
    } else { //challenger is leaving
      results.set("challenger", "null");
      await results.save();
      const challengerSolAddress = aPda.get("players")[1];
     // aPda.remove("players", challengerSolAddress);
      //aPda.set("ready", false);
      //aPda.save()

      return true; //you can leave now
    }
  } else return false; //you can not leave
});

Moralis.Cloud.define("findPDA", async (request) => {
  const pdaQry = new Parse.Query("Pda");
  pdaQry.equalTo("room", request.params.room);
  const aPda = await pdaQry.first();
  return aPda
})

Moralis.Cloud.define("checkWinner", async (request) => {
  const duelQry = new Parse.Query("Duel");
  duelQry.equalTo("room", request.params.room);
  const aDuel = await duelQry.first();
  if (request.params.user === aDuel.get("winner")) return true
  else return false
},{
  requireUser: true,
})

Moralis.Cloud.define("CheckPda", async (request) => {
 const qry = new Parse.Query("Pda");
 qry.equalTo("room", request.params.room);
 const aPda = await qry.first();
 if (aPda){
  const pda1 = aPda.pdas[0]
  const pda2 = aPda.pdas[1]
  if (pda1 === pda2) return true
  else return false

 }
});

Moralis.Cloud.define("createPDA", async (request) => {
  const Pda = Moralis.Object.extend("Pda");
  const some_pda = new Pda();
  some_pda.set("room", request.params.room);
  some_pda.set("ready", false)
  some_pda.set("room_master", request.params.roomMaster)
  //some_pda.set("address", "null")
  some_pda.addUnique("players", request.params.solAddress);
  await some_pda.save();
 });

 Moralis.Cloud.define("createRoom", async (request) => {
  const parameters = request.params;

  const Chat = Moralis.Object.extend("Chat");
  const aChat = new Chat();
  aChat.set("messages", []);

  const Room = Moralis.Object.extend("Room");
  const aRoom = new Room();
  aRoom.set("owner", parameters.owner);
  aRoom.set("bet_amount", parameters.bet);
  aRoom.set("playing", false);
  aRoom.set("challenger", "null");
  aRoom.set("room_name", parameters.room_name);
  aRoom.set("chat", aChat);
  aRoom.set("room_address", parameters.roomPDA)
  aRoom.save().then((aRoomObject) => {
    return aRoomObject
  });
 });

Moralis.Cloud.define("ready", async (request) => {
  const aPlayerData = request.params.playerData;
  const roomId = request.params.room;

  const qry = new Parse.Query("Duel");
  
  qry.equalTo("room", roomId);
  const results = await qry.first();
  if (results) {
    const playerList = results.get("players");
    if (playerList.length !== 2) {
      results.add("players", aPlayerData);
      await results.save();

      const aRoomQuery = new Parse.Query("Room");
      aRoomQuery.equalTo("objectId", roomId)
      const aRoom = await aRoomQuery.first();
      aRoom.set("playing", true) //only when last player is added can the game be started
      await aRoom.save()
    } 
    else return false;
  } 
  else {
    const Duel = Moralis.Object.extend("Duel");
    const aDuel = new Duel();
    aDuel.set("room", roomId);
    aDuel.set("ended", false);
    aDuel.add("players", aPlayerData);
    await aDuel.save();
  }
});

Moralis.Cloud.define("ready2", async (request) => {
  const aPlayerData = request.params.playerData;
  const player_choices = aPlayerData.choice; //is an array
 // const player_cards = aPlayerData.choiceIndexes; //is an array of card indexes
  const roomId = request.params.room;
  if (player_choices.length === 3){
    
  const qry = new Parse.Query("Duel");
  
  qry.equalTo("room", roomId);
  const aDuel = await qry.first();
  if (aDuel) {
    const playerList = aDuel.get("players");
    if (playerList.length === 1) {
      
      aDuel.add("players", aPlayerData);
      aDuel.set("ready", true)
      await aDuel.save();

      const aRoomQuery = new Parse.Query("Room");
      aRoomQuery.equalTo("objectId", roomId)
      const aRoom = await aRoomQuery.first();
      await aRoom.save()
    } 
    else {
      aDuel.add("players", aPlayerData);
      await aDuel.save();
    }
  }
  }
});

Moralis.Cloud.define("ready3", async (request) => {
  const roomId = request.params.room;
  const qry = new Parse.Query("Duel");
  
  qry.equalTo("room", roomId);
  const results = await qry.first();
  if (results) {
    const playerList = results.get("players");
    if (playerList.length !== 2) {
      
      const player = request.params.playerId;
      //generate 3 random numbers
      var choices = []
      for (let i = 0; i < 5; i++){
        var r = Math.floor(Math.random() * 3);
        choices.push(r.toString());
      }
      const newPlayerData = {player: player, choice: choices};
      results.add("players", newPlayerData);

      await results.save();

      const aRoomQuery = new Parse.Query("Room");
      aRoomQuery.equalTo("objectId", roomId)
      const aRoom = await aRoomQuery.first();

      aRoom.set("playing", true) //only when last player is added can the game be started
      //choose 3 cards randomly

      await aRoom.save()
      return choices;
    } 
    else return false;
  } 
  else {
    const Duel = Moralis.Object.extend("Duel");
    const aDuel = new Duel();
    aDuel.set("room", roomId);
    aDuel.set("ended", false);

    const player = request.params.playerId;
    //generate 3 random numbers
    var choices = []
    for (let i = 0; i < 5; i++){
      var r = Math.floor(Math.random() * 3);
      choices.push(r.toString());
    }
    const newPlayerData = {player: player, choice: choices};
    aDuel.add("players", newPlayerData);
    await aDuel.save();
    return choices;
  }
  
});

const Hands = {
  rock: '0',
  paper: '1',
  scissor: '2',
};

Moralis.Cloud.define("start", async (request) => {
  const aPlayerData = request.params.playerData;
  const roomId = request.params.room;

  const qry = new Parse.Query("Duel");
  qry.equalTo("room", roomId);
  const aDuel = await qry.first();
  if (aDuel) {
    if (!aDuel.get("ended")) {
      const players = aDuel.get("players");
      const player_one = players[0];
      const player_two = players[1];
      if (aPlayerData === player_one.player || aPlayerData === player_two.player) {
        //integrity check
        const player_one_choice = player_one.choice;
        const player_two_choice = player_two.choice;

        const player_one_username = player_one.player;
        const player_two_username = player_two.player;
        //0 is rock, 1 is paper, 2 is scissor
        switch (player_one_choice) {
          case Hands.rock: 
            switch (player_two_choice) {
              case Hands.rock:
                aDuel.set("winner", "draw");
                break;
              case Hands.paper:
                aDuel.set("winner", player_two_username);
                break;
              case Hands.scissor:
                aDuel.set("winner", player_one_username);
                break;
              default:
                aDuel.set("winner", player_one_username);
                break;
            };
            break;
          
          case Hands.paper: 
            switch (player_two_choice) {
              case Hands.rock:
                aDuel.set("winner", player_one_username);
                break;
              case Hands.paper:
                aDuel.set("winner", "draw");
                break;
              case Hands.scissor:
                aDuel.set("winner", player_two_username);
                break;
              default:
                aDuel.set("winner", player_one_username);
                break;
            };
            break;
          
          case Hands.scissor: 
            switch (player_two_choice) {
              case Hands.rock:
                aDuel.set("winner", player_two_username);
                break;
              case Hands.paper:
                aDuel.set("winner", player_one_username);
                break;
              case Hands.scissor:
                aDuel.set("winner", "draw");
                break;
              default:
                aDuel.set("winner", player_one_username);
                break;
            };
            break;
          default:
            aDuel.set("winner", player_two_username);
            break;
        }
        aDuel.set("ended", true);
        aDuel.save();
        return true;
      }
    } 
    else {
      return true
    }
  }
});

Moralis.Cloud.define("start2", async (request) => {
  const aPlayerData = request.params.playerData;
  const roomId = request.params.room;

  const qry = new Parse.Query("Duel");
  qry.equalTo("room", roomId);
  const aDuel = await qry.first();
  if (aDuel) {
    if (!aDuel.get("ended")) {
      const players = aDuel.get("players");
      const player_one = players[0];
      const player_two = players[1];
      if (aPlayerData === player_one.player || aPlayerData === player_two.player) {
        //integrity check
        const player_one_choice = player_one.choice; //should be array of choices
        const player_two_choice = player_two.choice; //should be array of choices

        const player_one_username = player_one.player;
        const player_two_username = player_two.player;

        let p1_score = 0;
        let p2_score = 0;
        //0 is rock, 1 is paper, 2 is scissor

        for(let i = 0; i < player_one_choice.length; i++){
          switch (player_one_choice[i]) {
            case Hands.rock: 
              switch (player_two_choice[i]) {
                case Hands.rock:
                  p1_score += 1;
                  p2_score += 1;
                  break;
                case Hands.paper:
                  p2_score += 1;
                  break;
                case Hands.scissor:
                  p1_score += 1;
                  break;
                default:
                  p1_score += 1;
                  break;
              };
              break;
            
            case Hands.paper: 
              switch (player_two_choice[i]) {
                case Hands.rock:
                  p1_score += 1;
                  break;
                case Hands.paper:
                  p1_score += 1;
                  p2_score += 1;
                   break;
                case Hands.scissor:
                  p2_score += 1;
                  break;
                default:
                  p1_score += 1;
                  break;
              };
              break;
            
            case Hands.scissor: 
              switch (player_two_choice[i]) {
                case Hands.rock:
                  p2_score += 1;
                  break;
                case Hands.paper:
                  p1_score += 1;
                  break;
                case Hands.scissor:
                  p1_score += 1;
                  p2_score += 1;
                  break;
                default:
                  p1_score += 1;
                  break;
              };
              break;
            default:
              p2_score += 1;
              break;
          }
        }
        const logger = Moralis.Cloud.getLogger();
        logger.info("p1 score: ", p1_score.toString(), " - p2 score: ", p2_score.toString())
        if (p1_score > p2_score)  aDuel.set("winner", player_one_username);
        else if (p1_score < p2_score) aDuel.set("winner", player_two_username);
        else if (p1_score === p2_score)  aDuel.set("winner", "draw");
        else aDuel.set("winner", "draw");
        aDuel.set("ended", true);
        aDuel.save();
        return true;
      }
    }
    else {
      return true
    }
  }
});

Moralis.Cloud.define("rematch", async (request) => {
  const rqry = new Parse.Query("Room");
  rqry.equalTo("objectId", request.params.roomId);
  const aRoom = await rqry.first();
  aRoom.set("playing", false);
  aRoom.set("ready", false);
  aRoom.save();

  const txQry = new Parse.Query("Transaction");
  txQry.equalTo("room", request.params.roomId);
  const aTx = await txQry.first();
  if (aTx){
    aTx.destroy()
  }
  
  const qry = new Parse.Query("Duel");
  qry.equalTo("room", request.params.roomId);
  const aDuel = await qry.first();
  if(aDuel){
    aDuel.destroy()
  }
});

Moralis.Cloud.define("isOwner", async (request) => {
  const roomId = request.params.roomId;
  const aRoomQuery = new Parse.Query("Room");
  aRoomQuery.equalTo("objectId", roomId)
  const aRoom = await aRoomQuery.first();
  if (aRoom.get("owner") === request.params.player){
    return true
  }
  else return false
})

Moralis.Cloud.define("getReady", async (request) => {
  const roomId = request.params.roomId;
  const aRoomQuery = new Parse.Query("Room");
  aRoomQuery.equalTo("objectId", roomId)
  const aRoom = await aRoomQuery.first();
  const ready = aRoom.get("ready")
  if (ready){
    aRoom.set("ready", false)
    await aRoom.save()
    return false
  }
  else{
    aRoom.set("ready", true)
    await aRoom.save()
    return true
  }
})

Moralis.Cloud.define("startRound", async (request) => {
  const roomId = request.params.room;
  const aRoomQuery = new Parse.Query("Room");
  aRoomQuery.equalTo("objectId", roomId)
  const aRoom = await aRoomQuery.first();
  aRoom.set("playing", true) //only when last player is added can the game be started
  await aRoom.save()
})

Moralis.Cloud.define("revealCard", async (request) => {
  const roomId = request.params.room;
  const aPlayerData = request.params.playerData;
  // const player_cards = aPlayerData.choiceIndexes; //is an array of card indexes
  if (aPlayerData.cards.length === 3) {
    const qry = new Parse.Query("Duel");
    qry.equalTo("room", roomId);
    const aDuel = await qry.first();
    if (aDuel) {
      const revealList = aDuel.get("reveals")
      if (revealList.length < 2) {
        aDuel.add("reveals", aPlayerData);
        aDuel.set("revealed", true);
        await aDuel.save();
      } else return false;
    } else {
      const Duel = Moralis.Object.extend("Duel");
      const aDuel = new Duel();
      aDuel.set("room", roomId);
      aDuel.set("ended", false);
      aDuel.set("players", []);
      aDuel.set("ready", false);
      aDuel.add("reveals", aPlayerData);
      aDuel.set("revealed", false);
      await aDuel.save();
    }
  }
});

Moralis.Cloud.define("getRoomBet", async (request) => {
  const roomId = request.params.room;
  const aRoomQuery = new Parse.Query("Room");
  aRoomQuery.equalTo("objectId", roomId)
  const aRoom = await aRoomQuery.first();
  const bet = aRoom.get("bet_amount");
  return bet
})

Moralis.Cloud.define("confirmTransaction", async (request) => {
  let aTx;
  let playerData;
  const roomId = request.params.room;
  const qry = new Parse.Query("Transaction");
  qry.equalTo("room", roomId);
  aTx = await qry.first();
  if (aTx){
    playerData = request.params.playerData;
    aTx.set("processed", true)
    aTx.add("players", playerData);
    aTx.save()
  }
  else{
    playerData = request.params.playerData;
    const Transaction = Moralis.Object.extend("Transaction");
    aTx = new Transaction();
    aTx.set("room", roomId);
    aTx.set("processed", false)
    aTx.add("players", playerData);
    aTx.save()
  }
})