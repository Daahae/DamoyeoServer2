var request = require('sync-request');
/* 최종 JSON 오브젝트 형식
{ buildingArr:
    [ { buildingLat:,
        buildingLng:,
        buildingName:,
        buildingAddress:,
        buildingTel:,
        buildingDescription:,
        buildingDistance:},
        {...}
    ]
}
*/
exports.getInfoByCategory = function (lat, lng, radius, type) {
      //var key = "AIzaSyBI4jrohgui2UIXOPf-qRmZi8wSbu4GX6Q";
      var key = "AIzaSyBjmChvkWBs63KJPrp5bu1dCY3H-ON3Idc";
      //var key = "AIzaSyCS6IE1uMTjMQ2WK4jwnTQE2pmDYgfUsPY";
      var url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=`+lat+`,`+lng+`&rankby=distance&type=`+ type +`&key=` + key + `&language=ko`;

      var res = request('GET', url);

      var jsonObject = JSON.parse(res.getBody());

      var object = new Object();
      var item = 'buildingArr';
      object[item] = [];

      var data;
      var distance;

      for(var i=0; i<jsonObject.results.length; i++) {
            distance = calculateDistance(lat, lng, jsonObject.results[i].geometry.location.lat, jsonObject.results[i].geometry.location.lng);
         if(jsonObject.results[i].rating == null) {
            data = {
               buildingName : jsonObject.results[i].name,
               buildingLat : jsonObject.results[i].geometry.location.lat,
               buildingLng : jsonObject.results[i].geometry.location.lng,
               buildingAddress : jsonObject.results[i].vicinity,
               buildingRating : 0,
               buildingDistance : parseInt(distance*1000)
            };
         }
         else if(type == "cafe" || type == "bar") { // 간혹 결과에 헤어샵이 포함되는 경우가 있어, 걸러주는 작업
            if(jsonObject.results[i].types.toString().indexOf("hair") == -1) {
               data = {
                  buildingName : jsonObject.results[i].name,
                  buildingLat : jsonObject.results[i].geometry.location.lat,
                  buildingLng : jsonObject.results[i].geometry.location.lng,
                  buildingAddress : jsonObject.results[i].vicinity,
                  buildingRating : jsonObject.results[i].rating,
                  buildingDistance : parseInt(distance*1000)
               };
            }
         } else {
            data = {
                  buildingName : jsonObject.results[i].name,
                  buildingLat : jsonObject.results[i].geometry.location.lat,
                  buildingLng : jsonObject.results[i].geometry.location.lng,
                  buildingAddress : jsonObject.results[i].vicinity,
                  buildingRating : jsonObject.results[i].rating,
                  buildingDistance : parseInt(distance*1000)
            };
         }
            if(distance > (radius / 1000)) continue;
            else {
                  object[item].push(data);
            }
      }

      if(jsonObject.status == "ZERO_RESULTS" || jsonObject.status == "OVER_QUERY_LIMIT")
         return JSON.stringify(object);

      if(JSON.stringify(object.buildingArr) == "[]")
         return JSON.stringify(object);

      return JSON.stringify(object);
}

//위도와 경도로 실제 거리 구하는 함수
function calculateDistance(lat1, lon1, lat2, lon2) {
      var R = 6371; // km
      var dLat = (lat2-lat1).toRad();
      var dLon = (lon2-lon1).toRad();
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var d = R * c;
      return d;
    }

    Number.prototype.toRad = function() {
      return this * Math.PI / 180;
    }
