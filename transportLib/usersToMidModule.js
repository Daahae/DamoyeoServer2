var transPortInfoModule = require('./transportInfoModule.js');
var transportJsonParseModule = require('./transportJsonParseModule.js');
var midPosToStringModule = require('../firebaseLib/midPosToStringModule.js');
var errorHandlingModule = require('../errorHandlingModule.js');


/* 입력받은 유저들 좌표 인지로 실행한 알고리즘 모듈 결과값 파싱
   + 경로정보
   + 중간좌표
   + 랜드마크정보
 */
module.exports.getInfo = function(req, midLat, midLng) {
  var jsonData;
  var jsonTotalArray = new Object();
  jsonTotalArray.userArr = new Array();
  jsonTotalArray.midInfo = new Object();
  var reqArray = new Array();
  reqArray = JSON.parse(req.body.userArr);
  reqArray = reqArray.userArr;


  for (var i = 0; i < reqArray.length; i++) {
    var start = new Array(reqArray[i].latitude, reqArray[i].longitude); // 유저 좌표
    jsonData = transPortInfoModule.getInfo(start[0], start[1], midLat, midLng);
    jsonTotalArray.userArr.push(jsonData);
  }
  
  jsonTotalArray.midInfo.midLat = midLat;
  jsonTotalArray.midInfo.midLng = midLng;

  return jsonTotalArray;
}


