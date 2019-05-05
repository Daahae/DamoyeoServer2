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
var dbModule = require('./dbModule.js');
var transPortInfoModule = require('./transportLib/transportInfoModule.js');
var usersToMidModule = require('./transportLib/usersToMidModule.js');
var transportJsonParseModule = require('./transportLib/transportJsonParseModule.js');
var nearBySearchModule = require('./nearBySearchLib/NearbySearch.js');
var nearBySearchDetailModule = require('./nearBySearchLib/GetDetailInfo.js');
var mysql = require('mysql');
var errorHandlingModule = require('./errorHandlingModule.js');
var deasync = require('deasync');
var midInfo = new Array(37.5637399, 126.9838655);




app.set('views', __dirname + '/view');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html'); //default엔진을 html로
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));

server.listen(3443);
console.log("Connected 3443port!@!@!@");


io.sockets.on('connection', function(socket) {
  var usernames = {};
  var rooms = ['room1', 'room2', 'room3'];
  console.log('Socket ID : ' + socket.id + ', Connect');

  /* email 받아서 어느방에 권한이 있는지 수정
   */

  socket.on('clientMessage', function(currentUser) {
    console.log('CurrentUser : ' + currentUser);
    socket.currentUser = currentUser; // 소켓 세션에 현재 접속 유저 등록
    var message = {
      msg: 'current user is',
      data: currentUser
    };
    socket.emit('serverMessage', message);
  });

  /* 친구와 함께 방 생성

  */
  socket.on('addUser', function(reqObj) {
    var reqObj = JSON.parse(reqObj);
    var emailList = emailList = reqObj.emailList.split(",");

    socket.room = reqObj.room;
    console.log(reqObj.emailList);
    socket.join(socket.room);
    socket.emit('updateChat', 'you have connected to ' + socket.room);



    for (var i = 0; i < emailList.length; i++) {
      console.log(emailList[i]);
      dbModule.insertUsersToChatRoom(emailList.length, emailList[i], socket.room, i + 1); // 디비에 사용자 기록
    }
    io.to(socket.room).emit('updateChat','[broadcast]'+emailList + ' has connected to this room');// 그룹 전체

    //socket.broadcast.to(socket.room).emit('updateChat', '[broadcast] '+emailList + ' has connected to this room');
    //socket.emit('updateRooms', rooms, 'room1');
  });
});

/*-------------------------------------------------------------------------------*/

app.get('/', function(req, res) {
  var jsonData;
  jsonData = transPortInfoModule.getInfo(37.2839068, 126.9722112, 37.5502596, 127.073139);
  res.send(jsonData);
});



app.get('/test', function(req, res) {
  var exec = require('child_process').execFileSync;
  var jsonPath = path.join(__dirname, '', 'ALGORITHM');
  console.log(jsonPath);

  var tmp = '{\"userArr\":[{\"latitude\":37.550277,\"longitude\":127.073053},\
   {\"latitude\":37.545036,\"longitude\":127.054245},\
   {\"latitude\":37.535413,\"longitude\":127.062388},\
   {\"latitude\":37.531359,\"longitude\":127.083799}]}';
  var resultObject;
  try {
    resultObject = exec(jsonPath, [tmp], {
      encoding: "utf8"
    });
    //resultObject = JSON.parse(resultObject);
  } catch (err) {
    err.stdout;
    console.log(err);
  }
  res.send(resultObject);
})

app.get('/chat', function(req, res) {
  res.render('index.html');
});


/* ----------------------- 위는 테스트 아래는 실 코드 --------------------------------------*/

/* 로그인 정보가 없을 시 디비에 계정추가, 안드에 0반환
   있을 시 1반환
*/
app.post('/login', function(req, res) {
  var resObj = dbModule.insertUserLoginInfo(req);
  res.send(resObj);
})

/*  카테고리 페이지. 분류해서 interestCategory에 삽입
    201스포츠 202노래방 203영화관 204오락실 205공원 206피씨방 207기타
    301포차 302바 303클럽 304기타
    401백화점(아울렛) 402대형마트 402시장 403기타
    501한식 502양식 502일식 504중식 505기타
*/
app.post('/category', function(req, res) {
  var resObj = dbModule.insertCategory(req);
  res.send(resObj);
})

/* 친구정보 가져오기, 친구 신청진행중 정보 포함

*/
app.post('/friend', function(req, res) {
  var resObj = dbModule.selectRelation(req);
  res.send(resObj)
})


/* 채팅방 정보 넘겨주기

*/
app.post('/chatRoom', function(req, res) {
  var resObj = dbModule.selectChatRoom(req);
  res.send(resObj)
})

/* 지도 뷰 갱신

*/
app.post('/renewPos', function(req, res) {
  var resObj = new Object();
  resObj.resArr = new Array();
  resObj.resArr = dbModule.updateUserPosInfo(req);
  res.send(resObj);
})

/* 좌표 정보 초기화
 */
app.post('/initPos', function(req, res) {
  var resObj = new Object();
  resObj = dbModule.initUserPosInfo(req);
  res.send(resObj);
})


/* 안드로이드에서 유저들좌표를 전송받음(req)
   알고리즘 모듈에서 최적 중간지점과 대중교통 경로정보 가져옴(resultObject)**
   유저들좌표에서 중앙지점까지의 교통정보, 랜드마크 정보 반환(usersToMidArray)
*/
app.post('/usersToMid', function(req, res) {
  var usersToMidArray = usersToMidModule.getInfo(req, midInfo[0], midInfo[1]);
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


/*
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
*/
