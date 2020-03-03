const csv = require('csv-parser');
const fs = require('fs');


async function getclimateData(date){
    date = new Date(date+' 00:00:00');
    const cities = await getCities();
    const cityTemps = await getCityTempsByDate(cities,date);
}

getclimateData('2020-01-15');

function getCities(){
    return new Promise( resolve=> {
        const cityArray = [];
        fs.createReadStream('./data/cities.csv')
        .pipe(csv())
        .on('data', (cityData) => cityArray.push(cityData))
        .on('end', () => { 
            resolve(cityArray);
        });
    });
}

function getCityTempsByDate(cities,date){
    //console.log(cities,date);
    return new Promise( resolve=>{
        
        const stationTemps = [];
        fs.createReadStream('./data/climate.csv')
        .pipe(csv())
        .on('data', (cityData) => {
            if (date.getFullYear() == parseInt(cityData.LOCAL_YEAR) && (date.getMonth()+1) == parseInt(cityData.LOCAL_MONTH) && date.getDate() == parseInt(cityData.LOCAL_DAY)){
                stationTemps.push(cityData);
            }
        })
        .on('end', () => { 
            cities.forEach(city => {
                //find the closest temp for each city on the day of
                
                for (i=0; i<stationTemps.length;i++){
                    stationTemps[i].distance = calculateDistance(city.lat, city.lng, stationTemps[i].lat, stationTemps[i].lng);
                }
                stationTemps.sort(function(a,b){
                    return a.distance - b.distance;
                });

                city.stationName = stationTemps[0].STATION_NAME; 
                city.stationLat = stationTemps[0].lat;
                city.stationLng = stationTemps[0].lng;

                city.meanTemp = stationTemps[0].MEAN_TEMPERATURE;
            });
            
            console.log(cities)
            resolve(cities);
        });
    });
  
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var radlon1 = Math.PI * lon1/180
    var radlon2 = Math.PI * lon2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI

    //distance in kilometers
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344
    
    return dist
  }

