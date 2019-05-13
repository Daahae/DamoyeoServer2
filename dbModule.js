var mysql = require('mysql');
var errorHandlingModule = require('./errorHandlingModule.js');
var deasync = require('deasync');

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
   /login
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

/* 친구 계정과 함께 방 생성
   디비에 사용자 기록
   소켓함수 addUser
*/
module.exports.insertUsersToChatRoom = function(count,user,room, i) {
  var sql = "UPDATE chatroom SET `count` = ?, user"+i+" =? WHERE roomNum = ?";
  conn.query(sql, [count, user,room], function(err, results, fields) {
    if (err)
      console.log("채팅방 삽입 에러");
    else
      console.log("채팅방 삽입 완료");
  });
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
      console.log(err);
    } else {
      var sql = "SELECT * from user where startLat != -1";
      // 존재하는 사용자 마커 좌표 검색
      conn.query(sql, function(err, userInfo, fields) {
        if (err) {
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

/* 좌표정보 초기화
   /initPos
*/
module.exports.initUserPosInfo = function(req) {
  var reqArray = JSON.parse(req.body.userPos);
  //var reqArray = req.body.userPos;
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
    var email = reqArray[i].email;
    var mostLike = reqArray[i].mostLike;
    var moreLike = reqArray[i].moreLike;
    var like = reqArray[i].like;

    var sql = "INSERT INTO interestcategory (email, mostLike, moreLike, normalLike) VALUES (?, ?, ?, ?)";
    conn.query(sql, [email, mostLike, moreLike, like], function(err, results, fields) {
      if (err) {
        console.log(err);
        resObj.msg = "Category insert fail";
      } else {
        resObj.msg = "Category insert success"
      }
    });
  }
  while (!errorHandlingModule.isObjectData(resObj)) {
    deasync.sleep(100);
  }
  return resObj;
}

/* 방번호를 받아 해당하는 채팅방의 정보 리턴
   중간지점 이미 찾았는지 리턴
   해당 방의 사람들이 찍은 마커 정보 반환
   /detailChatRoom
*/
module.exports.selectDetailChatRoom = function(req) {
  var reqObj = JSON.parse(req.body.chatRoom);
  var resObj = new Object();
  resObj.userArr = new Array();
  var email = reqObj.email;
  var roomNum = parseInt(reqObj.roomNumber);
  console.log("roomNum : " + roomNum);

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
          resObj.userArr.push(users);
        }
      });
    }
  });

  
  while (!errorHandlingModule.isData(resObj.userArr)) { 

    deasync.sleep(100);
  }
  console.log(resObj);
  return resObj;
}

/*  이메일이 속해있는 전체 방정보 가져오기
    /chatRoom      
 */
module.exports.selectChatRoom = function(req) {
  var reqObj = JSON.parse(req.body.chatRoom);
  var resObj = new Object();
  resObj.roomArr = new Array();
  //var email = "jong4876@naver.com";
  var email = reqObj.email;
  var i;
  var sql = "SELECT * FROM chatroom WHERE user1 = ? or user2 = ? or user3 = ? or user4 = ? or user5 = ? or user6 = ?";
  conn.query(sql, [email,email,email,email,email,email], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {  
         resObj.roomArr = results;
         var sql = "select * from user";
         conn.query(sql,[email], function(err, users, fields) {
          if (err) {
            console.log(err);
          } else {
            resObj.userObj = users;
          }
        })
       }
    })
  while (!errorHandlingModule.isData(resObj.roomArr)) { // 비동기 처리
   deasync.sleep(200);
  }
  console.log(resObj);
  return resObj;
}

/* 친구의 이메일이 존재하는지 여부 판단
   /friendSearch
 */
module.exports.selectFriendEmail = function(req) {
  var reqObj = JSON.parse(req.body.friend);
  var resObj = new Object();
  var userObj = new Object();
  resObj.userArr = new Array();

  var sql = "SELECT DISTINCT email, nickname, relation FROM user, relation where email in (select user2 from relation where user1 =?) and user1 = ?";
  conn.query(sql, [reqObj.email,reqObj.email], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {
      for (var i = 0; i < results.length; i++) {
        var userObj = new Object();
        userObj.email = results[i].email;
        userObj.nickname = results[i].nickname;
        userObj.relation = results[i].relation;
        resObj.userArr.push(userObj);
      }
    }
  });
 while (!errorHandlingModule.isData(resObj.userArr)) { // 비동기 처리
   deasync.sleep(100);
 }
  return resObj;
}



/* 친구관계 가저오기
   /friendRequest
 */
module.exports.selectRelation = function(req) {
  var reqObj = JSON.parse(req.body.friend);
  var resObj = new Object();
  var userObj = new Object();
  resObj.userArr = new Array();

  var sql = "SELECT DISTINCT email, nickname, relation FROM user, relation where email in (select user2 from relation where user1 =?) and user1 = ?";
  conn.query(sql, [reqObj.email,reqObj.email], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {
      for (var i = 0; i < results.length; i++) {
        var userObj = new Object();
        userObj.email = results[i].email;
        userObj.nickname = results[i].nickname;
        userObj.relation = results[i].relation;
        resObj.userArr.push(userObj);
      }
    }
  });
 while (!errorHandlingModule.isData(resObj.userArr)) { // 비동기 처리
   deasync.sleep(100);
 }
  return resObj;
}

/* 친구 요청
   보낸 사용자 받은 사용자 둘다 relation 0 으로 추가
   /friendAdd
 */
module.exports.insertRelation = function(req) {
  var reqObj = JSON.parse(req.body.friend);
  var resObj = new Object();
  var userObj = new Object();
  var myEmail = reqObj.myEmail;
  var destEmail = reqObj.destEmail;

  var sql = "INSERT INTO relation(`user1`, `user2`, `relation`) VALUES ( ?, ?, ?) ";
  conn.query(sql, [myEmail, destEmail, 0], function(err, results, fields) {
    if (err) {
      console.log(err);
      resObj.msg = 0;
    } else {
      conn.query(sql, [destEmail, myEmail,0], function(err, results, fields) {
        if (err) {
          console.log(err);
          resObj.msg = 0;
        } else {
          console.log("Success at adding friend!");
          resObj.msg = 1;
        }
      });
    }
  });
 while (!errorHandlingModule.isObjectData(resObj)) { // 비동기 처리
   deasync.sleep(100);
 }
  return resObj;
}


/* 친구 요청 수용
   보낸 사용자 받은 사용자 둘다 relation 1 으로 변경
   /friendAccept
 */
module.exports.acceptRelation = function(req) {
  var reqObj = JSON.parse(req.body.friend);
  var resObj = new Object();
  var userObj = new Object();
  var myEmail = reqObj.myEmail;
  var destEmail = reqObj.destEmail;

  var sql = "UPDATE relation SET relation = 1 WHERE user1 = ? and user2 = ?";
  conn.query(sql, [myEmail, destEmail], function(err, results, fields) {
    if (err) {
      console.log(err);
      resObj.msg = 0;
    } else {
      conn.query(sql, [destEmail, myEmail], function(err, results, fields) {
        if (err) {
          console.log(err);
          resObj.msg = 0;
        } else {
          console.log("Success at update friend!");
          resObj.msg = 1;
        }
      });
    }
  });
 while (!errorHandlingModule.isObjectData(resObj)) { // 비동기 처리
   deasync.sleep(100);
 }
  return resObj;
}

