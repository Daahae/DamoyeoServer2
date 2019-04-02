var GetInfoByCategory = require('./GetInfoByCategory.js');
var settingCategory = require('./SetCategory.js');
var deasync = require('deasync');

//lat, lng는 알고리즘에서 나온 결과값, radius는 고정값
//type은 userRequest: {type : 30} 과 같은 형식의 json오브젝트에서 따오기.

exports.getInfo = function(req) { //위도, 경도, 반경, 타입(cafe, shopping_mall, bar 등등)
    var reqObject = new Object();
    reqObject = JSON.parse(req.body.userRequest);// b 소문자로
    var category = settingCategory.setCategory(reqObject.type);
    var jsonTest = GetInfoByCategory.getInfoByCategory(reqObject.midLat, reqObject.midLng, 500, category );
    var jsonObject = JSON.parse(jsonTest);

    return jsonObject;
}
