var request = require('sync-request');

exports.getDetailInfo = function(req) {
    var reqObject = new Object();
    reqObject = JSON.parse(req.body.buildingRequest);

    var clientID = "jwlrRrud1mg1tJBxdoSh";
    var secret = "AwskMzduBL";

    var url = `https://openapi.naver.com/v1/search/local.json?query=` + encodeURI(reqObject.name) + `&display=1&start=1`;
    var url2  = `https://openapi.naver.com/v1/map/reversegeocode?query=` + reqObject.lng + `,` + reqObject.lat;
    var options = {
        headers: {
            'X-Naver-Client-Id': clientID,
            'X-Naver-Client-Secret': secret
        }
    };

    var res = request('GET', url, options);
    var res2 = request('GET', url2, options);
    var jsonObject = JSON.parse(res.getBody());
    var jsonObject2 = JSON.parse(res2.getBody());

    var object = new Object();

    var data;

    if(jsonObject.total == 0) {
        data = {
            buildingTel : "",
            buildingDescription : "",
            buildingAddress : jsonObject2.result.items[0]["address"]
        };
    } else {
        data = {
            buildingTel : jsonObject.items[0]["telephone"],
            buildingDescription : jsonObject.items[0]["description"],
            buildingAddress : jsonObject2.result.items[0]["address"]
        };
    }

    object = data;

    return object;
}
