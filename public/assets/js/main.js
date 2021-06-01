function getIRIParameterValue(requestedKey){
    let pageIRI = window.location.search.substring(1);
    let pageIRIVariables = pageIRI.split('&');
    for(let i = 0 ; i < pageIRIVariables.length; i++){
        let data = pageIRIVariables[i].split('=');
        let key = data[0];
        let value = data[1];
        if(key === requestedKey){
            return value;
        }
    }
    return null;
}

let username = decodeURI(getIRIParameterValue('username'));
if ((typeof username == 'undefined') || (username === null) || (username === 'null') || (username ==="")){
    username = "Anonymous_"+Math.floor(Math.random()*1000);
}

let chatRoom = decodeURI(getIRIParameterValue('game_id'));
if ((typeof chatRoom == 'undefined') || (chatRoom === null) || (chatRoom === 'null')){
    chatRoom = "Lobby";
}

let socket = io();
socket.on('log',function(array){
    console.log.apply(console,array);
});


function makeInviteButton(socket_id){
    let newHTML = "<button type='button' class='btn btn-outline-primary'>Invite</button>"
    let newNode = $(newHTML);
    newNode.click( () => {
        let payload = {
            requested_user:socket_id
        }
        console.log('**** Client log message, sending \'invite\' command: '+JSON.stringify(payload));    
        socket.emit('invite',payload);
    }
    );
    return newNode;
}

function makeInvitedButton(socket_id){
    let newHTML = "<button type='button' class='btn btn-primary'>Invited</button>"
    let newNode = $(newHTML);
    newNode.click( () => {
        let payload = {
            requested_user:socket_id
        }
        console.log('**** Client log message, sending \'uninvite\' command: '+JSON.stringify(payload));    
        socket.emit('uninvite',payload);
    }
    );
    return newNode;
}


function makePlayButton(socket_id){
    let newHTML = "<button type='button' class='btn btn-success'>Play</button>"
    let newNode = $(newHTML);
    newNode.click( () => {
        let payload = {
            requested_user:socket_id
        }
        console.log('**** Client log message, sending \'game_start\' command: '+JSON.stringify(payload));    
        socket.emit('game_start',payload);
    }
    );
    return newNode;
}

function makeStartGameButton(){
    let newHTML = "<button type='button' class='btn btn-danger'>Starting Game</button>"
    let newNode = $(newHTML);
    return newNode;
}

socket.on('invite_response', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makeInvitedButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
})

socket.on('invited', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makePlayButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
})

socket.on('uninvited', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makeInviteButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
})
socket.on('game_start_response', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makeStartGameButton();
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
    
    window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});

socket.on('join_room_response', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
   
    if (payload.socket_id === socket.id){
        return;
    }
    let domElements = $('.socket_'+payload.socket_id);
    if (domElements.length !== 0) {
        return;
    }
let nodeA = $("<div></div>");
nodeA.addClass("row");
nodeA.addClass("align-items-center");
nodeA.addClass("socket_"+payload.socket_id);
nodeA.hide();

let nodeB = $("<div></div>");
nodeB.addClass("col");
nodeB.addClass("text-end");
nodeB.addClass("socket_"+payload.socket_id);
nodeB.append('<h4>'+payload.username+'</h4>');



let nodeC = $("<div></div>");
nodeC.addClass("col");
nodeC.addClass("text-start");
nodeC.addClass("socket_"+payload.socket_id);
let buttonC = makeInviteButton(payload.socket_id);
nodeC.append(buttonC);

nodeA.append(nodeB);
nodeA.append(nodeC);

$("#players").append(nodeA);
nodeA.show("fade",1000);




    let newHTML = '<p class=\'join_room_response\'>'+payload.username+' joined the chatroom.  (There are '+payload.count+' users in this room)</p>';
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade",500);  
})


socket.on('player_disconnected', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }

    if(payload.socket_id === socket.id){
        return;
    }

    let domElements = $('.socket_'+payload.socket_id);
    if (domElements.length !== 0) {
        domElements.hide("fade",500);
    } 

    

    let newHTML = '<p class=\'left_room_response\'>'+payload.username+' left the '+payload.room+'.  (There are '+payload.count+' users in this room)</p>';
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade",500);  
})

function sendChatMessage(){
    let request = {};
    request.room = chatRoom;
    request.username=username;
    request.message = $('#chatMessage').val();
    console.log('**** Client log message, sending \'send_chat_message\' command: '+JSON.stringify(request));
    socket.emit('send_chat_message',request);
    $('#chatMessage').val("");
}

socket.on('send_chat_message_response', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }

    let newHTML = '<p class=\'chat_message\'><b>'+payload.username+'</b>: '+payload.message+'</p>';
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade",500);   
})

let old_board = [

        ['?','?','?','?','?','?','?','?'],
        ['?','?','?','?','?','?','?','?'],
        ['?','?','?','?','?','?','?','?'],
        ['?','?','?','?','?','?','?','?'],
        ['?','?','?','?','?','?','?','?'],
        ['?','?','?','?','?','?','?','?'],
        ['?','?','?','?','?','?','?','?'],
        ['?','?','?','?','?','?','?','?']
    ];

socket.on('game_update', (payload) =>{
    if((typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }

    let board = payload.game.board;
    if((typeof board == 'undefined') || (board === null)){
        console.log('Server did not send a valid board to display');
        return;
    }

    /* Update my color */


    /* Animate changes to the board */
    for (let row = 0; row <8; row++){
        for (let column = 0; column <8; column++){
                /* Changes */
                if(old_board[row][column] !== board[row][column]){
                    let graphic = "";
                    let altTag = "";
                    if((old_board[row][column] === '?') && (board[row][column] ===' ')){
                        graphic = "empty.gif";
                        altTag = "empty space";
                    }
                    else if((old_board[row][column] === '?') && (board[row][column] ==='w')){
                        graphic = "empty_to_pink.gif";
                        altTag = "pink token";
                    }
                    else if((old_board[row][column] === '?') && (board[row][column] ==='b')){
                        graphic = "empty_to_blue.gif";
                        altTag = "blue token";
                    }
                    else if((old_board[row][column] === ' ') && (board[row][column] ==='w')){
                        graphic = "empty_to_pink.gif";
                        altTag = "pink token";
                    }
                    else if((old_board[row][column] === ' ') && (board[row][column] ==='b')){
                        graphic = "empty_to_blue.gif";
                        altTag = "blue token";
                    }
                    else if((old_board[row][column] === 'w') && (board[row][column] ===' ')){
                        graphic = "empty.gif";
                        altTag = "empty space";
                    }
                    else if((old_board[row][column] === 'b') && (board[row][column] ===' ')){
                        graphic = "empty.gif";
                        altTag = "empty space";
                    }
                    else if((old_board[row][column] === 'w') && (board[row][column] ==='b')){
                        graphic = "pink_to_blue.gif";
                        altTag = "blue token";
                    }
                    else if((old_board[row][column] === 'b') && (board[row][column] ==='w')){
                        graphic = "blue_to_pink.gif";
                        altTag = "pink token";
                    }
                                        else if((old_board[row][column] === 'b') && (board[row][column] ==='w')){
                        graphic = "blue_to_pink.gif";
                        altTag = "pink token";
                    }
                    else {
                        graphic = "error.gif";
                        altTag = "error";
                    }

                    const t = Date.now();

                    $('#'+row+'_'+column).html('<img class="img-fluid" src="assets/images/'+graphic+'?time='+t+'" alt="'+altTag+'" />');

                }

        }


    }
    old_board = board;

})

$( () =>{
    let request = {};
    request.room = chatRoom;
    request.username = username;
    console.log('**** Client log message, sending\'join_room\' command: '+JSON.stringify(request));
    socket.emit('join_room',request);

$("#lobbyTitle").html(username + "'s Lobby");

    $('#chatMessage').keypress( function (e) {
        let key = e.which;
        if( key == 13){
          $('button[id = chatButton]').click();
        return false;
      }
    })

});

