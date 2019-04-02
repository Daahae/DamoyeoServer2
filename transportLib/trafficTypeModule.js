/* 교통수단의 종류 선택 모듈
   파싱시 쓰임
 */
module.exports.subwayType = function(trafficType) {
  if (trafficType == 1)
    return true;
  else
    return false;
}
module.exports.busType = function(trafficType) {
  if (trafficType == 2)
    return true;
  else
    return false;
}
module.exports.walkType = function(trafficType) {
  if (trafficType == 3)
    return true;
  else
    return false;
}
