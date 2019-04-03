var express = require('express'),
  app = express(),
  http = require('http'),
  server = http.createServer(app),
  io = require('socket.io').listen(server),
  bodyParser = require('body-parser');

var request = require('sync-request');
var exec = require('child_process').execFileSync;
var path = require('path');
var errorHandlingModule = require('./errorHandlingModule.js');
var runAlgorithmModule = require('./runAlgorithmModule.js');
var transPortInfoModule = require('./transportLib/transportInfoModule.js');
var usersToMidModule = require('./transportLib/usersToMidModule.js');
var transportJsonParseModule = require('./transportLib/transportJsonParseModule.js');
var nearBySearchModule = require('./nearBySearchLib/NearbySearch.js');
var nearBySearchDetailModule = require('./nearBySearchLib/GetDetailInfo.js');
var mysql = require('mysql');
var midInfo = new Array(37.5637399, 126.9838655);

app.set('views', __dirname + '/view');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html'); //default엔진을 html로
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static('public'));
server.listen(3443);
console.log("Connected 3443port!");

//db 계정 정보
var conn = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '11111111',
  database: 'damoyeo2db'
});

conn.connect();



app.get('/test', function(req, res) {
  var jsonData;
  var landmarkObject = new Object();
  jsonData = transPortInfoModule.getInfo(37.2839068, 126.9722112, 37.5502596, 127.073139);
  res.send(jsonData);
})

app.get('/chat', function(req, res) {
  res.render('index.html');
});

app.get('/login', function(req, res){
  var reqArray = new Array();
  var sql = 'select * from user';
  conn.query(sql, function(err, results, fields) {
      if (err) {
        console.log(err);
      } else {
        res.send(results);
      }
  });
})
/* 로그인 정보가 없을 시 디비에 계정추가, 안드에 0반환
   있을 시 1반환
*/
app.post('/login', function(req, res) {
  var reqArray = JSON.parse(req.body.userLoginInfo);
  console.log(reqArray);
})



/* 안드로이드에서 유저들좌표를 전송받음(req)
   알고리즘 모듈에서 최적 중간지점과 대중교통 경로정보 가져옴(resultObject)**
   유저들좌표에서 중앙지점까지의 교통정보, 랜드마크 정보 반환(usersToMidArray)
*/
app.post('/usersToMid', function(req, res) {
  var usersToMidArray = usersToMidModule.getInfo(req, midInfo[0], midInfo[1]); // 안드로이드에서 넘겨준 users 정보와 함께 모듈 실행
  res.send(usersToMidArray);
})

/* 대중교통 경로정보
   랜드마크를 목적지로 함
*/
app.post('/midTransportInfo', function(req, res) {
  var usersToMidArray = usersToMidModule.getTransportInfo(req);
  res.send(usersToMidArray);
})

/* 중간지점 알고리즘 사용 후,
   사용자의 카테고리 선택 정보를 받음
   해당하는 장소정보 안드로이드로 전송 (Google place API)
*/
app.post('/midCategory', function(req, res) {
  var midCategoryObject = nearBySearchModule.getInfo(req);
  res.send(midCategoryObject);
})

/* 카테고리의 장소에 대해 더 자세한 정보를 알고자 할 때
   전화번호, 장소에 대한 간단한 설명 반환
 */
app.post('/midDetailCategory', function(req, res) {
  var midDetailCategoryObject = nearBySearchDetailModule.getDetailInfo(req);
  res.send(midDetailCategoryObject);
})

// 멀티채널 가이드
// usernames which are currently connected to the chat
var usernames = {};
var rooms = ['room1', 'room2', 'room3'];

io.sockets.on('connection', function(socket) {

  //adduser 호출시 이 함수가 listen 후 실행
  socket.on('adduser', function(username) {
    // store the username in the socket session for this client
    socket.username = username;
    socket.room = 'room1';
    // add the client's username to the global list
    usernames[username] = username;
    // send client to room 1
    socket.join('room1');
    // echo to client they've connected
    socket.emit('updatechat', 'SERVER', 'you have connected to room1');
    // echo to room 1 that a person has connected to their room
    socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
    socket.emit('updaterooms', rooms, 'room1');
  });

  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function(data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('switchRoom', function(newroom) {
    socket.leave(socket.room);
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
    // sent message to OLD room
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
    socket.emit('updaterooms', rooms, newroom);
  });


  // when the user disconnects.. perform this
  socket.on('disconnect', function() {
    // remove the username from global usernames list
    delete usernames[socket.username];
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    socket.leave(socket.room);
  });
});
