// Link to run script on
// http://roaminghunger.com/food-trucks/

const stateToUrl = {};

const states = document.getElementsByClassName('row')[1].getElementsByClassName('col-sm-3');
for (let index = 0; index < states.length; index++) {
  const column = states[index];
  const stateListings = column.getElementsByClassName('stateListing');
  for (let j = 0; j < stateListings.length; j++) {
    const stateListing = stateListings[j];
    const state = stateListing.getElementsByClassName('subhead')[0];
    const stateName = state.getElementsByTagName('a')[0].text;
    const cityLists = stateListing.getElementsByClassName('cityList');
    stateToUrl[stateName] = [];
    for (let k = 0; k < cityLists.length; k++) {
      const cityList = cityLists[k];
      const cities = cityList.getElementsByTagName('li');
      for (let l = 0; l < cities.length; l++) {
        const city = cities[l];
        const cityA = city.getElementsByTagName('a')[0];
        let url = cityA.href;
        if (url.indexOf('1') !== -1) {
          url = url.slice(0, -2);
        }
        const cityName = cityA.text;
        stateToUrl[stateName].push({
          url,
          city: cityName
        });
      }
    }
  }
}

console.log(JSON.stringify(stateToUrl));
