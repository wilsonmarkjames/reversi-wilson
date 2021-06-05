let static = require('node-static');
let http = require('http');
let port = process.env.PORT;
let directory = __dirname + '/public';
if ((typeof port == 'undefined') || (port === null)){
    port = 8080;
    directory = './public';
}
let file = new static.Server(directory);

let app = http.createServer(
    function(request,response){
        request.addListener('end',
        function(){
            file.serve(request,response);
        }
    ).resume();
    }
).listen(port);

console.log('The server is running');

let players = [];

const { Server } = require("socket.io");
const io = new Server(app);

io.on('connection', (socket) => {

    function serverLog(...messages){
        io.emit('log',[ '**** Message from the server:\n']);
        messages.forEach((item) => {
            io.emit('log',['****\t'+item]);
            console.log(item);
        });

    }


    serverLog('a page connected to the server: '+socket.id);


    socket.on('join_room', (payload) => {
        serverLog('Server received a command', '\'join_room\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('join_room_response',response);
            serverLog('join_room command failed', JSON.stringify(response));
            return;
        }
        let room = payload.room;
        let username = payload.username;
        if ((typeof room == 'undefined') || (room === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid room to join';
            socket.emit('join_room_response',response);
            serverLog('join_room command failed', JSON.stringify(response));
            return;

        }
        if ((typeof username == 'undefined') || (username === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid username to join the chat';
            socket.emit('join_room_response',response);
            serverLog('join_room command failed', JSON.stringify(response));
            return;
        }
        socket.join(room);

        io.in(room).fetchSockets().then((sockets)=>{
        
            if ((typeof sockets == 'undefined') || (sockets ===null) || !sockets.includes(socket)){
                response = {};
                response.result = 'fail';
                response.message = 'Server internal error joining the chat room';
                socket.emit('join_room_response',response);
                serverLog('join_room command failed', JSON.stringify(response));
                return;
            }   
            else{
                players[socket.id] = {
                    username: username,
                    room: room
                }
                for (const member of sockets){
                    response = {
                        result: 'success',
                        socket_id: member.id,
                        room: players[member.id].room,
                        username: players[member.id].username,
                        count: sockets.length,
                    }
                io.of('/').to(room).emit('join_room_response',response);
                serverLog('join_room succeeded', JSON.stringify(response));
                if (room !== "Lobby") {
                    send_game_update(socket,room, 'initial update');
                }
                }
            }
        }); 
    });

    socket.on('invite', (payload) => {
        serverLog('Server received a command', '\'invite\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('invite_response',response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user ==="")){
            response = {
                result:'fail',
                message:'client did not request a valid user to invite to play'
            }
            socket.emit('invite_response',response);
            serverLog('invite command failed', JSON.stringify(response));
            return;

        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")){
            response = {
                result:'fail',
                message:'the user that was invited is not in a room'
            }
            socket.emit('invite_response',response);
            serverLog('invite command failed', JSON.stringify(response));
            return;

        }
        if ((typeof username == 'undefined') || (username === null) || (username ==="")){
            response = {
                result:'fail',
                message:'the user that was invited does not have a name registered'
            }
            socket.emit('invite_response',response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
        
            if ((typeof sockets == 'undefined') || (sockets ===null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was invited is no longer in the room'
                }
                socket.emit('invite command failed',response);
                serverLog('invite command failed', JSON.stringify(response));
                return;
            }   
            else{
                response = {
                    result:'success',
                    socket_id: requested_user
                }
                socket.emit("invite_response", response);

                response = {
                    result:'success',
                    socket_id: socket.id
                }
                socket.to(requested_user).emit("invited", response);
                serverLog('invite command succeeded', JSON.stringify(response));
            }
        }); 
    })

    socket.on('uninvite', (payload) => {
        serverLog('Server received a command', '\'uninvite\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('uninvited',response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user ==="")){
            response = {
                result:'fail',
                message:'client did not request a valid user to uninvite to play'
            }
            socket.emit('uninvited',response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;

        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")){
            response = {
                result:'fail',
                message:'the user that was uninvited is not in a room'
            }
            socket.emit('uninvited',response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;

        }
        if ((typeof username == 'undefined') || (username === null) || (username ==="")){
            response = {
                result:'fail',
                message:'the user that was invited does not have a name registered'
            }
            socket.emit('uninvited',response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
        
            if ((typeof sockets == 'undefined') || (sockets ===null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was uninvited is no longer in the room'
                }
                socket.emit('uninvited',response);
                serverLog('uninvited command failed', JSON.stringify(response));
                return;
            }   
            else{
                response = {
                    result:'success',
                    socket_id: requested_user
                }
                socket.emit("uninvited", response);

                response = {
                    result:'success',
                    socket_id: socket.id
                }
                socket.to(requested_user).emit("uninvited", response);
                serverLog('uninvite command succeeded', JSON.stringify(response));
            }
        }); 
    })

    socket.on('game_start', (payload) => {
        serverLog('Server received a command', '\'game_start\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('game_start_response',response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user ==="")){
            response = {
                result:'fail',
                message:'client did not request a valid user to engage in play'
            }
            socket.emit('game_start_response',response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;

        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")){
            response = {
                result:'fail',
                message:'the user that was engaged to play is not in a room'
            }
            socket.emit('game_start_response',response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;

        }
        if ((typeof username == 'undefined') || (username === null) || (username ==="")){
            response = {
                result:'fail',
                message:'the user that was engaged to play does not have a name registered'
            }
            socket.emit('game_start_response',response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
        
            if ((typeof sockets == 'undefined') || (sockets ===null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was engaged to play is no longer in the room'
                }
                socket.emit('game_start_response',response);
                serverLog('game_start command failed', JSON.stringify(response));
                return;
            }   
            else{
                let game_id = Math.floor(1 + Math.random() * 0x100000).toString(16);
                response = {
                    result:'success',
                    game_id: game_id,
                    socket_id: requested_user
                }
                socket.emit("game_start_response", response);

                socket.to(requested_user).emit("game_start_response", response);
                serverLog('game_start command succeeded', JSON.stringify(response));
            }
        }); 
    })

    socket.on('disconnect', () =>{
        serverLog('a page disconnected from the server: '+socket.id);
        if((typeof players[socket.id] != 'undefined') && (players[socket.id] != null)){
            let payload = {
                username: players[socket.id].username,
                room: players[socket.id].room,
                count: Object.keys(players).length - 1,
                socket_id: socket.id
            };
            let room = players[socket.id].room;
            delete players[socket.id];
            io.of("/").to(room).emit('player_disconnected',payload);
            serverLog('player disconnected succeeded ',JSON.stringify(payload));
        }
    });
    
    socket.on('send_chat_message', (payload) => {
        serverLog('Server received a command', '\'send_chat_message\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('send_chat_message_response',response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;
        }

        let room = payload.room;
        let username = payload.username;
        let message = payload.message;
        
        if ((typeof room == 'undefined') || (room === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid room to message';
            socket.emit('send_chat_message_response',response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;

        }
        if ((typeof username == 'undefined') || (username === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid username as a message source';
            socket.emit('send_chat_message_response',response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;
        }
      
        if ((typeof message == 'undefined') || (message === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid message';
            socket.emit('send_chat_message_response',response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;
        }

        let response = {};
        response.result = 'success';
        response.username = username;
        response.room = room;
        response.message = message;

        io.of('/').to(room).emit('send_chat_message_response',response);
        serverLog('send_chat_message command succeeded', JSON.stringify(response));
    });

    socket.on('play_token', (payload) => {
        serverLog('Server received a command', '\'play_token\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }
        let player = players[socket.id];
        
        if ((typeof player == 'undefined') || (player === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'play_token came from an unregistered player';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;

        }

        let username = player.username;

        if ((typeof username == 'undefined') || (username === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'play_token command did not come from a registered username';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let game_id = player.room;
      
        if ((typeof game_id == 'undefined') || (game_id === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'There was no valid game associated with the play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let row = payload.row;
      
        if ((typeof row == 'undefined') || (row === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'There was no valid row associated with the play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let column = payload.column;
      
        if ((typeof column == 'undefined') || (column === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'There was no valid column associated with the play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let color = payload.color;
      
        if ((typeof color == 'undefined') || (color === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'There was no valid color associated with the play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }
    
        let game = games[game_id];
      
        if ((typeof game == 'undefined') || (game === null)){
            let response = {};
            response.result = 'fail';
            response.message = 'There was no valid game associated with the play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        /* Make sure the current attempt is by the correct color */

        if (color !== game.whose_turn){

            let response = {
                result: 'fail',
                message: 'play_token played the wrong color.  It is not their turn.'
            }
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));   
            return;

        }

                /* Make sure the current play is coming from the expected player */

                if (
                    ((game.whose_turn === 'pink') && (game.player_pink.socket != socket.id)) ||
                    ((game.whose_turn === 'blue') && (game.player_blue.socket != socket.id))
                    ){
                    let response = {
                        result: 'fail',
                        message: 'play_token played the right color, but by the wrong player.'
                    }
                    socket.emit('play_token_response',response);
                    serverLog('play_token command failed', JSON.stringify(response));  
                    return;         
                }

        let response = {
            result: 'success'
        }
        socket.emit('play_token_response',response);

        if ( color === 'pink') {
            game.board[row][column] = 'p';
            flip_tokens('p',row,column,game.board);
            game.whose_turn = 'blue';
            game.legal_moves = calculate_legal_moves('b',game.board);
        }
       else if ( color === 'blue') {
            game.board[row][column] = 'b';
            flip_tokens('b',row,column,game.board);
            game.whose_turn = 'pink';
            game.legal_moves = calculate_legal_moves('p',game.board);
        }

        send_game_update(socket,game_id,'played a token');

    });
});

let games = [];

function create_new_game() {
    let new_game = {};
    new_game.player_pink = {};
    new_game.player_pink.socket = "";
    new_game.player_pink.username = "";

    new_game.player_blue = {};
    new_game.player_blue.socket = "";
    new_game.player_blue.username = "";

    var d = new Date();
    new_game.last_move_time = d.getTime();

    new_game.whose_turn = 'blue';

    new_game.board = [
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ','p','b',' ',' ',' '],
        [' ',' ',' ','b','p',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' ']
    ];

    new_game.legal_moves = calculate_legal_moves('b',new_game.board);

    return new_game;

}

function check_line_match(color,dr,dc,r,c,board){
    
    if(board[r][c] === color){
        return true;
    }

    /*Check to make sure we aren't going to walk off the board */

    if(board[r][c] === ' '){
        return false;
    }

    if ((r + dr < 0) || (r + dr > 7)){
        return false;       
    }
    if ((c + dc < 0) || (c + dc > 7)){
        return false;       
    }
    return(check_line_match(color,dr,dc,r+dr,c+dc,board));
}

/* Return true if r + dr supports playing at r and c + dc supports playing */
function adjacent_support(who,dr,dc,r,c,board){

    let other;
     
    if (who === 'b'){
        other = 'p';
    }
    else if (who==='p'){
        other = 'b';
    }
    else {
        log("Houston we have a problem:");
        return false;
    }

    /* Check to make sure that the adjacent support is on the board */

    if ((r + dr < 0) || (r + dr > 7)){
        return false;       
    }
    if ((c + dc < 0) || (c + dc > 7)){
        return false;       
    }

    /* Check that the opposite color is present */

    if (board[r+dr][c+dc] !== other){
        return false;
    }

    /* Check to make sure that there is space for a matching color to capture matching tokens */

    if ((r + dr + dr < 0) || (r + dr + dr > 7)){
        return false;       
    }
    if ((c + dc + dc < 0) || (c + dc + dc > 7)){
        return false;       
    }

    return check_line_match(who,dr,dc,r+dr+dr,c+dc+dc, board);
}

function calculate_legal_moves(who, board){

let legal_moves = [
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' ']
    ];

    for(let row = 0; row < 8; row++){
         for(let column = 0; column <8; column++){
            if (board[row][column] === ' '){

                nw = adjacent_support(who,-1, -1, row, column, board);
                nn = adjacent_support(who,-1, 0, row, column, board);
                ne = adjacent_support(who,-1, 1, row, column, board);

                ww = adjacent_support(who,0, -1, row, column, board);
                ee = adjacent_support(who,0, 1, row, column, board);

                ss = adjacent_support(who,1,0,row,column,board);
                sw = adjacent_support(who,1, -1, row, column, board);
                se = adjacent_support(who,1, 1, row, column, board);
                
                if(nw || nn || ne || ww || ee || sw || ss|| se){
                    legal_moves[row][column] = who;
                }
            }

         }
    }

    return legal_moves;  
}

function flip_line(who,dr,dc,r,c,board) {
 if ((r + dr < 0) || (r + dr > 7)){
    return false;       
}
if ((c + dc < 0) || (c + dc > 7)){
    return false;       
}
if (board[r+dr][c+dc] === ' '){
    return false;
}

if (board[r+dr][c+dc] === who){
    return true;
}
else{
    if(flip_line(who,dr,dc,r+dr,c+dc,board)){
        board[r+dr][c+dc] = who;
        return true;
    }
    else{
        return false;
    }
}

}

function flip_tokens(who,row,column,board){

    nw = adjacent_support(who,-1, -1, row, column, board);
                flip_line(who,-1, 0, row, column, board);
                flip_line(who,-1, 1, row, column, board);

                flip_line(who,0, -1, row, column, board);
                flip_line(who,0, 1, row, column, board);

                flip_line(who,1,0,row,column,board);
                flip_line(who,1, -1, row, column, board);
                flip_line(who,1, 1, row, column, board);


}

function send_game_update(socket,game_id,message){

    /* Check to see if a game with game_id exists*/

    if ((typeof games[game_id] == 'undefined') || (games[game_id] === null)){
        console.log("No game exists with game_id:"+game_id+". Making a new game for "+ socket.id);
        games[game_id] = create_new_game();
    }

 /* Assign this socket a color*/
 io.of('/').to(game_id).allSockets().then((sockets) =>{

        const iterator = sockets[Symbol.iterator]();
        if(sockets.size >=1) {
            let first = iterator.next().value;
            if((games[game_id].player_pink.socket != first) &&
                (games[game_id].player_blue.socket !=first)) {
                    
                /*Player does not have a color */
                if (games[game_id].player_pink.socket === "") {
                    /*Player should be pink */
                    console.log("pink is assigned to: " + first);
                    games[game_id].player_pink.socket = first;
                    games[game_id].player_pink.username = players[first].username;
                }
                else if (games[game_id].player_blue.socket === "") {
                    /*Player should be blue */
                    console.log("blue is assigned to: " + first);
                    games[game_id].player_blue.socket = first;
                    games[game_id].player_blue.username = players[first].username;
                }

                else {
                    /*This player should be kicked out */
                    console.log("Kicking " + first + " out of game: " + game_id);
                    io.in(first).socketsLeave([game_id]);
                }


            }

            
        }
        if(sockets.size >=2) {
            let second = iterator.next().value;
            if((games[game_id].player_pink.socket != second) &&
                (games[game_id].player_blue.socket !=second)) {
                    
                /*Player does not have a color */
                if (games[game_id].player_pink.socket === "") {
                    /*Player should be pink */
                    console.log("pink is assigned to: " + second);
                    games[game_id].player_pink.socket = second;
                    games[game_id].player_pink.username = players[second].username;
                }
                else if (games[game_id].player_blue.socket === "") {
                    /*Player should be blue */
                    console.log("blue is assigned to: " + second);
                    games[game_id].player_blue.socket = second;
                    games[game_id].player_blue.username = players[second].username;
                }

                else {
                    /*This player should be kicked out */
                    console.log("Kicking " + second + " out of game: " + game_id);
                    io.in(second).socketsLeave([game_id]);
                }


            }

            
        }

         /* Send Game Update*/
         let payload = {
            result: 'success',
            game_id: game_id,
            game: games[game_id],
            message: message

        }

        io.of("/").to(game_id).emit('game_update', payload);

 })

          /* Check if the game is over*/

          let legal_moves =0;
          let pinksum = 0;
          let bluesum = 0;

          for (let row = 0; row<8; row++){
            for (let column = 0; column<8; column++){
                if(games[game_id].legal_moves[row][column] !== ' '){
                    legal_moves++;
                }
                if(games[game_id].board[row][column] === 'p'){
                    pinksum++;
                }
                if(games[game_id].board[row][column] === 'b'){
                    bluesum++;
                }
            }

          }

        if(legal_moves === 0 ) {
            let winner = "Tie Game";
            if(pinksum > bluesum){
                winner = "pink";

            }

            if(pinksum < bluesum){
                winner = "blue";

            }

            let payload = {
                result: 'success',
                game_id: game_id,
                game: games[game_id],
                who_won: winner
            }
        io.in(game_id).emit('game_over',payload);

        /* Delete old games after one hour */

        setTimeout(
            ((id) => {
                return (() => {
                    delete games[id];
                });

            })(game_id), 60 * 60 * 1000
            );

        }

 

}