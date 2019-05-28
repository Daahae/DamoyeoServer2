
    
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




// 로그인 관련
/* -------------------------------------------------------------- */


// 채팅방 수정 후 초기화
module.exports.resetChatRoom = function(room) {
  var sql = "UPDATE `chatroom` SET `user1`=NULL,`user2`=NULL,`user3`=NULL,`user4`=NULL, `user5`=NULL,`user6`=NULL WHERE roomNum = ?";
  conn.query(sql, [room], function(err, results, fields) {
    if (err)
      console.log("채팅방 초기화 에러");
    else
      console.log("채팅방 초기화 완료");
  });
}


/* 친구 계정과 함께 채팅방 생성 (update)
   디비에 사용자 기록
   소켓함수 addUser
*/
module.exports.insertUsersToChatRoom = function(count,user,room, i) {
  var sql = "UPDATE chatroom SET `count` = ?, midFlag = 0 ,user"+i+" =? WHERE roomNum = ?";
  conn.query(sql, [count, user,room], function(err, results, fields) {
    if (err)
      console.log("채팅방 삽입 에러");
    else
      console.log("채팅방 삽입 완료");
  });
}
module.exports.insertMsgToChatMsg = function(message, roomNum, time) {
  var sql = "INSERT INTO chatmsg (roomNum, userNickName, msg, sendTime) VALUES (?, ?, ?, ?)";
  conn.query(sql, [roomNum, message.user, message.data, time], function(err, results, fields) {
    if (err){

      console.log("메시지 삽입 에러");
      console.log(err);
    }
    else
      console.log("메시지 삽입 완료");
  });
}

module.exports.selectMsgFromChatMsg = function(roomNum) { // 메시지 최근순으로 가져오기
  var message = new Object();
  var sql = "SELECT * FROM `chatmsg` WHERE roomNum = ? order by sendTime";
  conn.query(sql, [roomNum], function(err, results, fields) {
    if (err)
      console.log("메시지 가져오기 에러");
    else{
      console.log("메시지 가져오기 완료");
      message = results;
      if(results.length == 0)
        message = "no data";

    }
  });

  while (!errorHandlingModule.isObjectData(message)) { // 비동기 처리
    deasync.sleep(100);
  }
  return message;
}



// 소켓 함수 관련
/* -------------------------------------------------------------- */
// 지도 관련

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
        resObj.msg = "Category insert success";
      }
    });
  }
  while (!errorHandlingModule.isObjectData(resObj)) {
    deasync.sleep(100);
  }
  return resObj;
}

/*-----------------------------------------------------------------*/




/* 방 유저들의 카테고리 정보들을 받아 
    알고리즘 결과값을 반환
    카테고리 페이지. 분류해서 interestCategory에 삽입
  한식 200 양식 201 일식 202 중식 203,
  스포츠 300 노래방 301 영화관 302 오락실 303 놀이공원 304 pc방 305 카페 306
  포장마차 500 바 501 이자카야 502 룸술집 503 일반술집 504
  */

function scheduleAlg(categoryObj) {
  var resObj = new Object();
  var reqObj = new Object();
  var reqArr = Array.apply(0, new Array(17)).map(Number.prototype.valueOf,0);

  for (var i = 0; i < categoryObj.length; i++) {
    var idx;
    var mostLike = categoryObj[i].mostLike*1;
    var moreLike = categoryObj[i].moreLike*1;
    var normalLike = categoryObj[i].normalLike*1;
    if(mostLike/100 >= 2 && mostLike/100 < 3){ // 음식
      idx = mostLike%200;
      reqArr[idx] += 3; // 가중치 3
    }
    else if(mostLike/100 < 4){ // 놀거리
      idx = mostLike%300+4;
      reqArr[idx] += 3; 
    }
    else if(mostLike/100 >= 5 && mostLike/100 < 6){ // 술집
      idx = mostLike%500+11;
      reqArr[idx] += 3; 
    }

    /*---------*/

    if(moreLike/100 >= 2 && moreLike/100 < 3){
      idx = moreLike%200;
      reqArr[idx] += 2;
    }
    else if(moreLike/100 < 4){ 
      idx = moreLike%300+4;
      reqArr[idx] += 2; 
    }
    else if(moreLike/100 >= 5 && moreLike/100 < 6){
      idx = moreLike%500+11;
      reqArr[idx] += 2; 
    }

    /*---------*/

    if(normalLike/100 >= 2 && normalLike/100 < 3){ 
      idx = normalLike%200;
      reqArr[idx] += 1; 
    }
    else if(normalLike/100 < 4){
      idx = normalLike%300+4;
      reqArr[idx] += 1; 
    }
    else if(normalLike/100 >= 5 && normalLike/100 < 6){ 
      idx = normalLike%500+11;
      reqArr[idx] += 1; 
    }
  }
  // 딥러닝 모듈에 데이터 전달을 위한 가공

/* 파이썬 바이너리 파일 돌아가게 하기~

*/

  // 딥러닝을 통한 결과
  resObj.scheduleArr = new Array();
  var scheduleObj = new Object();
  scheduleObj.startTime = "17:00";
  scheduleObj.storeName = "샘플 당구장";
  scheduleObj.category = "스포츠";
  scheduleObj.address = "서울시 광진구";
  resObj.scheduleArr.push(scheduleObj);

  var scheduleObj = new Object();
  scheduleObj.startTime = "19:00";
  scheduleObj.storeName = "샘플 고깃집";
  scheduleObj.category = "한식";
  scheduleObj.address = "서울시 광진구";
  resObj.scheduleArr.push(scheduleObj);

  var scheduleObj = new Object();
  scheduleObj.startTime = "21:00";
  scheduleObj.storeName = "샘플 이자카야";
  scheduleObj.category = "이자카야";
  scheduleObj.address = "서울시 광진구";
  resObj.scheduleArr.push(scheduleObj);


  return resObj;
}

/*스케줄링 메서드

 */

module.exports.selectSchedule = function(req,res) {
  var reqArray = JSON.parse(req.body.schedule);
  var roomNum =reqArray.roomNum;
  var resObj = new Object();
  var categoryObj = new Object();
  var sql = "SELECT * FROM chatroom where roomNum = ?";
  conn.query(sql, [roomNum], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {  
         categoryObj.memberCount = results[0].count; // 방의 멤버 수
         var user1 = results[0].user1;
         var user2 = results[0].user2;
         var user3 = results[0].user3;
         var user4 = results[0].user4;
         var user5 = results[0].user5;
         var user6 = results[0].user6;

         var sql = "select * from interestcategory where email = ? or  email = ? or email = ? or email = ? or email = ? or email = ?";
         conn.query(sql,[user1, user2, user3, user4,user5, user6], function(err, category, fields) {
          if (err) {
            console.log(err);
          } else {
            categoryObj.category = category;
            resObj = scheduleAlg(categoryObj.category);

            res.send(resObj);
          }
        })
       }
    })
}






/* 방번호를 받아 해당하는 채팅방의 정보 리턴
   중간지점 이미 찾았는지 리턴
   해당 방의 사람들이 찍은 마커 정보 반환
   /detailChatRoom
*/
module.exports.selectDetailChatRoom = function(req) {
  console.log(req.body);
  var reqObj = JSON.parse(req.body.chatRoom);
  var resObj = new Object();
  resObj.userArr = new Array();
  var email = reqObj.email;
  var roomNum = parseInt(reqObj.roomNumber);

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
    console.log("selectDetailChatRoom 에러");
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
    console.log("selectChatRoom 에러");
   deasync.sleep(100);
  }
  console.log(resObj);
  return resObj;
}


/*-------------------------------------------*/
// 친구관리 메서드

module.exports.selectFriendEmailbySocket = function(email) {
  var nickname = null;
  var sql = "select * from user where email = ?";
  conn.query(sql, [email], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {
      nickname = results[0].nickname;
    }
  });
 while (nickname == null) { // 비동기 처리
  deasync.sleep(100);
 }
  return nickname;
}

/* 친구의 이메일이 존재하는지 여부 판단
   /friendSearch
 */
module.exports.selectFriendEmail = function(req) {
  var reqObj = JSON.parse(req.body.friend);
  var resObj = new Object();
  var userObj = new Object();
  resObj.userArr = new Array();

  var sql = "select nickname from user where email = ?";
  conn.query(sql, [reqObj.email], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {
      if(results.length !=0){
        resObj.userArr = results;
        resObj.exist = 1;
        resObj.nickname = results[0].nickname;
      }
      else
        resObj.exist = 0;
        resObj.nickname = null;
    }
  });
 while (!errorHandlingModule.isData(resObj.userArr)) { // 비동기 처리
  console.log("selectFriendEmail 에러");
  deasync.sleep(100);
 }
  return resObj;
}



/* 친구관계 가저오기
   /friendRequest
 */
module.exports.requestRelation = function(req,res) {
  var reqObj = JSON.parse(req.body.friend);
  var resObj = new Object();
  var userObj = new Object();
  resObj.friendArr = new Array();
  resObj.waitingFriendArr = new Array();

  var sql = "SELECT DISTINCT email, nickname FROM user, relation where email in (select user1 from relation where user2 = ? and relation = ?)";
  conn.query(sql, [reqObj.email, 1], function(err, results, fields) {
    if (err) {
      console.log(err);
    } else {
      for (var i = 0; i < results.length; i++) {
        var userObj = new Object();
        userObj.email = results[i].email;
        userObj.nickname = results[i].nickname;
        resObj.friendArr.push(userObj);
      }
      var sql = "SELECT DISTINCT email, nickname FROM user, relation where email in (select user1 from relation where user2 = ? and relation = ?)";
      conn.query(sql, [reqObj.email, 0], function(err, results, fields) {
        if (err) {
          console.log(err);
        } else {
          for (var i = 0; i < results.length; i++) {
            var userObj = new Object();
            userObj.email = results[i].email;
            userObj.nickname = results[i].nickname;
            resObj.waitingFriendArr.push(userObj);
          }
        }
        console.log(resObj);
        res.send(resObj);
      });
    }
  });
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

  var sql = "INSERT INTO relation(user1, user2, relation) VALUES ( ?, ?, ?) ";
  conn.query(sql, [myEmail, destEmail, 0], function(err, results, fields) {
    if (err) {
      console.log(err);
      resObj.msg = 0;
    } else {
      resObj.msg = 1;
    }
  });
 while (!errorHandlingModule.isObjectData(resObj)) { // 비동기 처리
   deasync.sleep(100);
 }
  console.log(resObj);
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
  var accept = reqObj.accept;
  console.log(reqObj);

  if(accept == 1){
   var sql = "UPDATE relation SET relation = 1 WHERE user1 = ? and user2 = ? and relation = 0";
    conn.query(sql, [destEmail, myEmail], function(err, results, fields) {
      if (err) {
        console.log("update Err");
        resObj.msg = 0;
      } else {
        var sql = "INSERT INTO relation(user1, user2, relation) VALUES ( ?, ?, ?)"; 
        conn.query(sql, [myEmail, destEmail, 1], function(err, results, fields) {
          if (err) {
            console.log("insert Err");
            console.log(err);
            resObj.msg = 0;
          } else {
            console.log("Success at accept friend!");
            resObj.msg = 1;
          }
        });
      }
    });
  }
  else{
    var sql = "DELETE FROM relation WHERE user1 = ? and user2 = ? and relation = 0"; 
    conn.query(sql, [destEmail, myEmail], function(err, results, fields) {
      if (err) {
        console.log(err);
        resObj.msg = 0;
      } else {
        console.log("Success at delete friend!");
        resObj.msg = 1;
      }
    });
  }

  while (!errorHandlingModule.isObjectData(resObj)) { // 비동기 처리
    deasync.sleep(100);
  }
  console.log(resObj);
   return resObj;
}
