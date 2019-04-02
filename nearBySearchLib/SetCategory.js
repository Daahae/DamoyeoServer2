//category
var DEPARTMENT_STORE = 11;
var SHOPPING_MALL = 12;
var STADIUM = 21;
var ZOO = 22;
var MUSEUM = 23;
var MOVIE_THEATER = 24;
var AQUARIUM = 25;
var CAFE = 30;
var BAR = 40;
var RESTAURANT = 50;
var PARK = 60;

exports.setCategory = function(type) {
    switch(type) {
        case DEPARTMENT_STORE :
            var category = "department_store";
            break;
        case SHOPPING_MALL :
            var category = "shopping_mall";
            break;
        case STADIUM :
            var category = "stadium";
            break;
        case ZOO :
            var category = "zoo";
            break;
        case MUSEUM :
            var category = "museum";
            break;
        case MOVIE_THEATER :
            var category = "movie_theater";
            break;
        case AQUARIUM :
            var category = "aquarium";
            break;
        case CAFE :
            var category = "cafe";
            break;
        case BAR :
            var category = "bar";
            break;
        case RESTAURANT :
            var category = "restaurant";
            break;
        case PARK :
            var category = "park";
            break;
    }

    return category;
}