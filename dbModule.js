var mysql = require('mysql');
var errorHandlingModule = require('./errorHandlingModule.js');
var deasync = require('deasync');

//db 계정 정보
var conn = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '11111111',
  database: 'damoyeo2db'
});

conn.connect();


/* 로그인 정보가 없을 시 디비에 계정추가, 안드에 0반환
   있을 시 1반환
*/
module.exports.insertUserLoginInfo = function(req) {
  var reqObj = JSON.parse(req.body.userLoginInfo);
  var resObj = new Object();
  var email = reqObj.email;
  var nickname = reqObj.nickname;

  var sql = "INSERT INTO user (email, nickname) VALUES (?, ?)";
  conn.query(sql, [email, nickname], function(err, results, fields) {
    if (err) {
      console.log("기본키 중복");
      resObj.history = 1;
    } else {
      console.log("계정삽입 완료");
      resObj.history = 0;
    }
  });
  while (!errorHandlingModule.isObjectData(resObj)) {
    deasync.sleep(100);
  }
  return resObj;
}


/* --------------------------------------------------------------지도 관련 */
/* mapview에서의 동기화를 위한 업데이트 메서드
  결과값으로 타인의 좌표와 같이 전송 **
  입력값이 없을 땐 -1
  다음페이지로 넘어갔을 떈 -1로 다시 갱신해야 할 듯
  차후에 chatroom 테이블에 이메일 삽입후 갱신하는 방향으로 바꿔야 할듯
*/
module.exports.updateUserPosInfo = function(req) {
  var reqArray = JSON.parse(req.body.userPos); // 안드수신용
  //var reqArray = req.body.userPos; // 테스트용
  var resArr = new Array();
  var email = reqArray.email;
  var startLat = reqArray.startLat + "";
  var startLng = reqArray.startLng + "";


  var sql = "UPDATE user SET startLat = ?, startLng = ? WHERE email = ?";
  conn.query(sql, [startLat, startLng, email], function(err, results, fields) {
    if (err) {
      console.log("좌표갱신 실패");
      console.log(err);
    } else {
      console.log("좌표갱신 완료");
      var sql = "SELECT * from user where startLat != -1";
      // 존재하는 사용자 마커 좌표 검색
      conn.query(sql, function(err, userInfo, fields) {
        if (err) {
          console.log("검색 실패");
        } else {
          for (var i = 0; i < userInfo.length; i++) {
            var resObj = new Object();
            resObj.email = userInfo[i].email;
            resObj.nickname = userInfo[i].nickname;
            resObj.startLat = userInfo[i].startLat;
            resObj.startLng = userInfo[i].startLng;
            resArr.push(resObj);
          }
        }
      })
    }
  });
  while (!errorHandlingModule.isData(resArr)) { // 비동기 처리
    deasync.sleep(100);
  }
  return resArr;
}

module.exports.initUserPosInfo = function(req) {
  var reqArray = JSON.parse(req.body.userPos); // 안드수신용
  //var reqArray = req.body.userPos; // 테스트용
  var resObj = new Object();
  var email = reqArray.email;
  var startLat = -1;
  var startLng = -1;

  var sql = "UPDATE user SET startLat = ?, startLng = ? WHERE email = ?";
  conn.query(sql, [startLat, startLng, email], function(err, results, fields) {
    if (err) {
      console.log("좌표갱신 실패");
      console.log(err);
    } else {
      console.log("좌표갱신 완료");
    }
  });
  while (!errorHandlingModule.isData(resArr)) { // 비동기 처리
    deasync.sleep(100);
  }
  return resObj;
}

/*-----------------------------------------------------------------*/


/* 계정별 Category선호 정보를 삽입하기 위한 메서드
   선호도 순서
*/
module.exports.insertCategory = function(req) {
  var reqArray = JSON.parse(req.body.categoryInfoArr);
  //var reqArray = req.body.categoryInfoArr; // 테스트용
  var resObj = new Object();

  for (var i = 0; i < reqArray.length; i++) {
    // 반복문 돌면서 삽입
    var email = reqArray[i].email;
    var mostLike = reqArray[i].mostLike;
    var moreLike = reqArray[i].moreLike;
    var like = reqArray[i].like;

    var sql = "INSERT INTO interestcategory (email, mostLike, moreLike, normalLike) VALUES (?, ?, ?, ?)";
    conn.query(sql, [email, mostLike, moreLike, like], function(err, results, fields) {
      if (err) {
        console.log("카테고리 삽입 실패");
        console.log(err);
        resObj.msg = "Category insert fail";
      } else {
        console.log("카테고리 삽입 완료");
        resObj.msg = "Category insert success"
      }
    });
  }
  while (!errorHandlingModule.isObjectData(resObj)) { // 비동기 처리
    deasync.sleep(100);
  }
  return resObj;
}

/* 방번호를 받아 해당하는 채팅방의 정보 리턴
   중간지점 이미 찾았는지 리턴
   해당 방의 사람들이 찍은 마커 정보 반환
*/
module.exports.selectChatRoom = function(req) {
var reqObj = JSON.parse(req.body.chatRoom);
var resObj = new Object();
resObj.userArr = new Array();
var email = reqObj.email;
var roomNum = parseInt(reqObj.roomNumber);
console.log("roomNum : "+roomNum);

// 방 입장시 증가
var sql = "SELECT * FROM chatroom WHERE roomNum = ?";
conn.query(sql, [roomNum], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {
      resObj.roomNum = results[0].roomNum;
      resObj.count = results[0].count;
      resObj.midFlag = results[0].midFlag;
      var user1 = results[0].user1;
      var user2 = results[0].user2;
      var user3 = results[0].user3;
      var user4 = results[0].user4;
      var user5 = results[0].user5;
      var user6 = results[0].user6;
      var sql = "SELECT * FROM user WHERE email = ? or email = ? or email = ? or email = ? or email = ? or email = ?";
      conn.query(sql, [user1, user2, user3, user4, user5, user6], function(err, users, fields) {
          if (err) {
            console.log(err);
          } else {
            // 존재하는 유저만 걸러서 정보 select
            for (var i = 0; i < users.length; i++) {
              var userObj =new Object();
              userObj.email = users[i].email;
              userObj.nickname = users[i].nickname;
              userObj.startLat = users[i].startLat;
              userObj.startLng = users[i].startLng;
              resObj.userArr.push(userObj);
            }
          }
        });
  }
});

while (!errorHandlingModule.isData(resObj.userArr)) { // 비동기 처리
  deasync.sleep(100);
}
console.log(resObj);
return resObj;
}
