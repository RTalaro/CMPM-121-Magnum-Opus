import leaflet, { Tooltip } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

import faceImg from "./face.png";

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
const SPAWN_AREA = 50;
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
const itemList: string[] = [
  "letter",
  "word",
  "clause",
  "sentence",
  "paragraph",
  "paper",
  "novel",
  "series",
];

const emojiList: string[] = [
  "O",
  "DO",
  "DO YOU",
  "YOU DON'T READ, DO YOU?",
  "¶",
  "📄",
  "📕",
  "📚",
];

interface cellItem {
  name: string;
  rank: number;
  location: [i: number, j: number] | null;
}

// player data
const playerPos: leaflet.LatLng = origin;
const playerIcon = leaflet.icon({
  iconUrl: faceImg,
  iconSize: [78.3, 49.2],
});
const playerMarker = leaflet.marker(playerPos, { icon: playerIcon });
playerMarker.addTo(map);
let playerItem: cellItem | null = null;
if (playerItem == null) textDiv.innerHTML = "Empty hand :(";

function spawn(i: number, j: number) {
  console.log(i, j);
  const value = Math.floor(luck([i, j, "initialValue"].toString()) * 9);
  const item: cellItem = {
    name: itemList[value],
    rank: value,
    location: [i, j],
  };

  let opacity: number = 1.0;
  let interactive: boolean = true;
  const distLat = playerPos.lat - (origin.lat + i * CELL_SIZE);
  const distLng = playerPos.lng - (origin.lng + j * CELL_SIZE);
  if (
    (distLat > 0 && distLat > PLAYER_REACH) ||
    (distLat < 0 && distLat < -PLAYER_REACH)
  ) {
    opacity = .5;
    interactive = false;
  } else if (
    (distLng > 0 && distLng > PLAYER_REACH) ||
    (distLng < 0 && distLng < -PLAYER_REACH)
  ) {
    opacity = .5;
    interactive = false;
  }

  const cell = leaflet.circle([
    origin.lat + i * CELL_SIZE,
    origin.lng + j * CELL_SIZE,
  ], {
    radius: 5,
    opacity: opacity,
    weight: 2.5,
    color: "#2a5596ff",
    interactive: interactive,
  }).addTo(map);
  cell.bindTooltip(emojiList[value], { direction: "top" });

  cell.addEventListener("click", () => {
    const tooltip: Tooltip = cell.getTooltip()!;
    // pick up
    if (playerItem == null) {
      playerItem = {
        name: item.name,
        rank: item.rank,
        location: item.location,
      };
      item.rank = -1;
      tooltip.setOpacity(0);
    } // place down
    else if (item.rank == -1) {
      item.name = playerItem.name;
      item.rank = playerItem.rank;
      item.location = playerItem.location;
      tooltip.setOpacity(0.9);
      tooltip.setContent(emojiList[item.rank]);
      playerItem = null;
    } // craft
    else if (playerItem.rank == value) {
      tooltip.setOpacity(0);
      playerItem.name = itemList[value + 1];
      playerItem.rank = value + 1;
      item.rank = -1;
      textDiv.innerHTML = "You win!!!!!!!!!!!!!!!!!!!!!!!!!!!!";
      return;
    }
    updateText();
  });
}

function updateText() {
  if (playerItem != null) {
    textDiv.innerHTML = `Holding ${playerItem.name} ${
      emojiList[playerItem.rank]
    }`;
  } else textDiv.innerHTML = "Empty hands :(";
}

// spawn caches
for (let i = -SPAWN_AREA; i < SPAWN_AREA; i++) {
  for (let j = -SPAWN_AREA; j < SPAWN_AREA; j++) {
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawn(i, j);
    }
  }
}
