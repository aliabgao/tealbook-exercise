const csv = require('csv-parser');
const fs = require('fs');


async function getClimateData(date){
    try{
        if (!validateDate) 
            throw new Error('Please provide a valid ISO Date (ex. 2020-03-17)');

        date = new Date(date+' 00:00:00');
        if (date.toString() === 'Invalid Date')
            throw new Error('Please provide a valid ISO Date (ex. 2020-03-17)');
        
        const cities = await getCities();
        const cityTemps = await getCityTempsByDate(cities,date);
        const temperatureData = await getCanadaTemperatures(cityTemps,date);
        return await temperatureData;
        
    }catch(err){
        return err.message;
    }
}
    
async function callGetClimateData(date){
    const climateData = await getClimateData(date);
}

// call to function
callGetClimateData('2020-02-06');



function getCities(){
    return new Promise( resolve=> {
        
        try{
            const cityArray = [];
            fs.createReadStream('./data/cities.csv')
            .pipe(csv())
            .on('data', (cityData) => cityArray.push(cityData))
            .on('end', () => { 
                resolve(cityArray);
            });
        }catch(err){
            return reject(new Error(err.message));
        }
    });
}

function getCityTempsByDate(cities,date){
    
    return new Promise( (resolve, reject)=>{
        
        const stationTemps = [];
        try{
            fs.createReadStream('./data/climate.csv')
            .pipe(csv())
            .on('data', (cityData) => {
                if (date.getFullYear() == parseInt(cityData.LOCAL_YEAR) && (date.getMonth()+1) == parseInt(cityData.LOCAL_MONTH) && date.getDate() == parseInt(cityData.LOCAL_DAY)){
                    stationTemps.push(cityData);
                }
            })
            .on('end', () => { 
                if (stationTemps.length === 0)
                    return reject(new Error('No climate data found for the date entered.'));

                cities.forEach(city => {
                    //find the closest temp for each city on the day 
                    
                    for (i=0; i<stationTemps.length;i++){
                        stationTemps[i].distance = distance(city.lat, city.lng, stationTemps[i].lat, stationTemps[i].lng, 'K');
                    }
                    stationTemps.sort(function(a,b){
                        return a.distance - b.distance;
                    });

                    //found stations without temps for a date.
                    //find the closes station with a temp to the city.
                    //in another iteration, use a distance threshold to exclude the city for the date.
                    for (i=0; i<stationTemps.length;i++){
                        if (stationTemps[i].MEAN_TEMPERATURE.trim() !== ''){
                            city.stationName = stationTemps[i].STATION_NAME; 
                            city.stationLat = stationTemps[i].lat;
                            city.stationLng = stationTemps[i].lng;
                            city.meanTemp = stationTemps[i].MEAN_TEMPERATURE;
                            break;
                        }
                    }
                });
                
                return resolve(cities);
            });
        }catch(err){
            return reject(new Error(err.message));
        }
    });
  
}

function getCanadaTemperatures(cityData, date){
    return new Promise( resolve=>{
        let canadaTemperatures = { 
            date: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate() ,
            meanTemperature: getMeanTemperature(cityData),
            medianTemperature: getMedianTemperature(cityData)
        };

        resolve(canadaTemperatures);
    });
}

function getMedianTemperature(cityData){
    const cityTemperatures = cityData.slice().map(cities=>parseFloat(cities.meanTemp)).sort((a,b) => a-b);
    const medianIndex= Math.floor(cityTemperatures.length/2);

    if (cityTemperatures.length % 2 === 0){
        return ((cityTemperatures[medianIndex - 1] + cityTemperatures[medianIndex]) / 2).toFixed(1);
    }

    return cityTemperatures[medianIndex].toFixed(1);
}

function getMeanTemperature(cityData){
    const cityTemperatures = cityData.slice().map(cities=>parseFloat(cities.meanTemp));
    
    const sum = cityTemperatures.reduce((accumulator, currentValue) => accumulator + currentValue);
    const avg = (sum / cityTemperatures.length).toFixed(1) ;

    return avg;
}

function validateDate(dateString){
    return dateString.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/);
}

function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

