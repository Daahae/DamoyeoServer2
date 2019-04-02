var errorHandlingModule = require('./errorHandlingModule.js');
var exec = require('child_process').execFileSync;
var path = require('path');

/* algoPath 경로에 있는 알고리즘 모듈을 요청받은 좌표와 함꼐 실행
 */
module.exports.getInfo = function(req, algoPath) {
  var jsonPath = path.join(__dirname, 'algorithm', 'ALGORITHM');
  var reqArray = req.body.userArr;
  var resultObject;
  try {
    resultObject = exec(jsonPath, [reqArray], {
      encoding: "utf8"
    });
  } catch (err) {
    return "Algorithm Error";
  }
  return resultObject;
}
