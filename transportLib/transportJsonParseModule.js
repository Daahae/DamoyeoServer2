var trafficTypeModule = require('./trafficTypeModule.js');

/* odsayAPI 서버에서 받아온 결과값  JSON 파싱해서 넘겨줌
 */
module.exports.getJsonData = function(obj) {

  var totalJsonObject = new Object();
  var trafficJsonArray = new Array();
  var path = new Array();
  var subPathArr = new Array();
  var subInfoObj = new Object();

  var lane = new Array();
  var totalTime = 0;
  var timeBySubway = 0;
  var timeByBus = 0;
  var timeByWalk = 0;
  var subwayCityCode;
  var payment;

  obj = obj.result;
  path = obj.path;

  subPathArr = path[0].subPath; // 최단시간의 정보
  subInfoObj = path[0].info;
  payment = subInfoObj.payment;

  for (var i = 0; i < subPathArr.length; i++) {
    var trafficJsonObject = new Object();
    var startStation = null;
    var endStation = null;
    var transportNumber = null;
    var busType = null
    var subwayCode = null
    var trafficType = subPathArr[i].trafficType;

    var sectionTime = subPathArr[i].sectionTime;

    if (!trafficTypeModule.walkType(trafficType)) { // 지하철이나 버스 이용 시
      startStation = subPathArr[i].startName;
      endStation = subPathArr[i].endName;

      if (trafficTypeModule.subwayType(trafficType)) { // 지하철 이용 시 호선 리턴
        laneArr = subPathArr[i].lane;
        transportNumber = laneArr[0].name;
        subwayCode = laneArr[0].subwayCode;
        timeBySubway += sectionTime;

      } else { // 버스 이용 시 버스번호 리턴
        laneArr = subPathArr[i].lane;
        transportNumber = laneArr[0].busNo;
        busType = laneArr[0].type;
        timeByBus += sectionTime;
      }

    } else { //도보 시
      timeByWalk += sectionTime;
    }

    trafficJsonObject.subwayCode = subwayCode;
    trafficJsonObject.busType = busType;
    trafficJsonObject.trafficType = trafficType;
    if(sectionTime != 0)
    trafficJsonObject.sectionTime = sectionTime;
    trafficJsonObject.transportNumber = transportNumber;
    trafficJsonObject.startStation = startStation;
    trafficJsonObject.endStation = endStation;

    trafficJsonArray.push(trafficJsonObject);
    totalTime += sectionTime;
  }

  totalJsonObject.subPathArr = trafficJsonArray;
  totalJsonObject.payment = payment;
  totalJsonObject.timeBySubway = timeBySubway;
  totalJsonObject.timeByBus = timeByBus;
  totalJsonObject.timeByWalk = timeByWalk;
  totalJsonObject.totalTime = totalTime;

  return totalJsonObject;
}
