import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";

import "./_leafletWorkaround.ts";

import luck from "./_luck.ts";

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const textDiv = document.createElement("div");
textDiv.id = "text";
document.body.append(textDiv);

const origin = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

const MAX_ZOOM = 19;
const CELL_SIZE = 1e-4;
const SPAWN_AREA = 100;
const PLAYER_REACH = 0.0003;
const CACHE_SPAWN_PROBABILITY = 0.1;

// configure map
const map = leaflet.map(mapDiv, {
  center: origin,
  zoom: MAX_ZOOM,
  minZoom: 5,
  maxZoom: MAX_ZOOM,
  zoomControl: true,
  scrollWheelZoom: true,
});

// background map
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: MAX_ZOOM,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// token data

// player data
const playerPos: leaflet.LatLng = origin;
const playerMarker = leaflet.marker(playerPos);
playerMarker.addTo(map);

const playerItem = null;
if (playerItem == null) textDiv.innerHTML = "Empty hand :(";

function spawn(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * CELL_SIZE, origin.lng + j * CELL_SIZE],
    [origin.lat + (i + 1) * CELL_SIZE, origin.lng + (j + 1) * CELL_SIZE],
  ]);

  let opacity: number = 1.0;
  const distLat = playerPos.lat - (origin.lat + i * CELL_SIZE);
  const distLng = playerPos.lng - (origin.lng + j * CELL_SIZE);
  if (
    (distLat > 0 && distLat > PLAYER_REACH) ||
    (distLat < 0 && distLat < -PLAYER_REACH)
  ) opacity = .5;
  else if (
    (distLng > 0 && distLng > PLAYER_REACH) ||
    (distLng < 0 && distLng < -PLAYER_REACH)
  ) opacity = .5;
  leaflet.circle([origin.lat + i * CELL_SIZE, origin.lng + j * CELL_SIZE], {
    radius: 5,
    opacity: opacity,
  }).addTo(map);
  leaflet.rectangle(bounds, { opacity: opacity }).addTo(map);
}

// spawn caches
for (let i = -SPAWN_AREA; i < SPAWN_AREA; i++) {
  for (let j = -SPAWN_AREA; j < SPAWN_AREA; j++) {
    // If location i,j is lucky enough, spawn a cache!
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawn(i, j);
    }
  }
}
