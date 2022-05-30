/* eslint-disable  */

const locations = JSON.parse(document.getElementById("map").dataset.locations);
console.log(locations);

mapboxgl.accessToken =
  "pk.eyJ1IjoiYW5kcmUwMjA2IiwiYSI6ImNsM3NmanZqOTB2Z2Mzam53NnV5enJxeXMifQ.axWJ_n1HlxYzIRwtluldlA";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
});
