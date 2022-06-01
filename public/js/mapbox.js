/* eslint-disable  */

const locations = JSON.parse(document.getElementById("map").dataset.locations);
console.log(locations);

mapboxgl.accessToken =
  "pk.eyJ1IjoiYW5kcmUwMjA2IiwiYSI6ImNsM3NmanZqOTB2Z2Mzam53NnV5enJxeXMifQ.axWJ_n1HlxYzIRwtluldlA";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  //create marker
  const el = document.createElement("div");
  el.className = "marker";
  //add marker
  new mapboxgl.Marker({
    element: el,
    anchor: "bottom",
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  //create popup
  new mapboxgl.Popup({
    offset: 30,
  })
    .setLngLat(loc.coordinates)
    .setHTML(
      <p>
        Day ${loc.day}: ${loc.description}
      </p>
    )
    .addTo(map);
  //extends map bounds to include marker locations
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    right: 100,
    left: 100,
  },
});
