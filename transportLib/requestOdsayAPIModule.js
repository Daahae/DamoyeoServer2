var request = require('sync-request');
var errorHandlingModule = require('../errorHandlingModule.js');

/*좌표와 함께 odsayAPI 서버에 교통정보 요청
 */
module.exports.getData = function(start, end) {

  var url = "https://api.odsay.com/v1/api/searchPubTransPath?SX=" + start[1] + "&SY=" + start[0] + "&EX=" + end[1] + "&EY=" + end[0] + "&apiKey=e98Y7jByby2Fay1uQ%2fvdQA%2bbpMeoIubG7lRqEONiG8A";
  var res = request('GET', url);
  var obj = JSON.parse(res.getBody('utf8'));

  if(!errorHandlingModule.isRequestData(obj))
    return;

  return obj;
}
