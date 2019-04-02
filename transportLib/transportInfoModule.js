var transportJsonParseModule = require('./transportJsonParseModule.js');
var requestOdsayAPIModule = require('./requestOdsayAPIModule.js');
var errorHandlingModule = require('../errorHandlingModule.js');

/*두 좌표사이의 교통정보 반환
 */
module.exports.getInfo = function(startLatitude, startLongitude, endLatitude, endLongitude) {
  var start = new Array(startLatitude, startLongitude);
  var end = new Array(endLatitude, endLongitude);
  var obj = requestOdsayAPIModule.getData(start, end); // 오디세이 API에 교통정보 요청
  var errorObj = errorHandlingModule.returnErrMsg("Reqeust error. Check if difference of position is under 700m.");

  if (!errorHandlingModule.isData(obj))
    return errorObj;


  var jsonData = transportJsonParseModule.getJsonData(obj); // 요청받은 데이터 파싱
  JSON.stringify(jsonData);

  return jsonData;
}
