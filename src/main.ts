import leaflet, { Tooltip } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

import faceImg from "./face.png";

// DOM

document.title = "Magnum Opus";

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const textDiv = document.createElement("div");
textDiv.id = "text";
document.body.append(textDiv);

const upDiv = document.createElement("div");
document.body.append(upDiv);
const up = document.createElement("button");
up.id = "up";
up.textContent = "⬆";

const left = document.createElement("button");
left.id = "left";
left.textContent = "⬅";
const down = document.createElement("button");
down.id = "down";
down.textContent = "⬇︎";
const right = document.createElement("button");
right.id = "right";
right.textContent = "➡";

const allButtons: HTMLButtonElement[] = [up, left, down, right];
for (const button of allButtons) {
  document.body.append(button);
  if (button.id == "up") {
    const buttonsDiv = document.createElement("div");
    document.body.append(buttonsDiv);
  }
  button.addEventListener("click", () => {
    const lat = 0.00017137304;
    const lng = 0.00021457672;
    switch (button.id) {
      case "up":
        playerPos.lat += lat;
        break;
      case "down":
        playerPos.lat -= lat;
        break;
      case "left":
        playerPos.lng -= lng;
        break;
      case "right":
        playerPos.lng += lng;
        break;
      default:
        return;
    }
    playerMarker.setLatLng(playerPos);
    map.setView(playerPos);
    displayCells();
  });
}

const origin = leaflet.latLng(0, 0);
const start_pos = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

const MAX_ZOOM = 19;
const CELL_SIZE = 1e-4;
const SPAWN_AREA = 50;
const PLAYER_REACH = 0.0003; // about 30 meters in lat/lng
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

// display map
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: MAX_ZOOM,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// DATA TYPES AND GAME STATE

interface Item {
  name: string;
  label: string;
  rank: number;
}

interface Cell {
  item: Item | null;
  location: leaflet.LatLng;
  marker: leaflet.Circle;
  tooltip: Tooltip;
}

const allItems: Item[] = [
  { name: "letter", label: "O", rank: 0 },
  { name: "word", label: "DO", rank: 1 },
  { name: "clause", label: "DO YOU", rank: 2 },
  { name: "sentence", label: "YOU DON'T READ, DO YOU?", rank: 3 },
  { name: "paragraph", label: "¶", rank: 4 },
  { name: "paper", label: "📄", rank: 5 },
  { name: "novel", label: "📕", rank: 6 },
  { name: "series", label: "📚", rank: 7 },
];

//const allCells: Cell[] = [];

const FINAL_ITEM: string = "series";
let playerPos: leaflet.LatLng = start_pos;
const playerIcon = leaflet.icon({
  iconUrl: faceImg,
  iconSize: [78.3, 49.2], // 10% of original img size
});
const playerMarker = leaflet.marker(playerPos, { icon: playerIcon });
playerMarker.addTo(map);
let playerItem: Item | null = null;
textDiv.innerHTML = "Empty hand :(";

const actions = {
  pickUp: (cell: Cell) => {
    const item: Item | null = cell.item;
    playerItem = {
      name: item!.name,
      label: item!.label,
      rank: item!.rank,
    };
    cell.item = null;
    cell.tooltip.setOpacity(0);
  },
  placeDown: (cell: Cell) => {
    const tooltip = cell.tooltip;
    cell.item = {
      name: playerItem!.name,
      label: playerItem!.label,
      rank: playerItem!.rank,
    };
    tooltip.setOpacity(0.9);
    tooltip.setContent(
      `${
        allItems[cell.item.rank].label
      } <br> (${cell.location.lat}, ${cell.location.lng})`,
    );
    playerItem = null;
  },
  craft: (cell: Cell) => {
    cell.tooltip.setOpacity(0);
    const rank = playerItem!.rank + 1;
    playerItem = {
      name: allItems[rank].name,
      label: allItems[rank].label,
      rank: rank,
    };
    cell.item = null;
  },
};

function spawn(lat: number, lng: number) {
  console.log(lat, lng);
  const value = Math.floor(luck([lat, lng, "initialValue"].toString()) * 5);
  const item: Item = {
    name: allItems[value].name,
    label: allItems[value].label,
    rank: value,
  };
  return item;
}

function updateText() {
  if (playerItem != null) {
    textDiv.innerHTML = `Holding ${playerItem.name} ${
      allItems[playerItem.rank].label
    }`;
    if (playerItem.name == FINAL_ITEM) {
      textDiv.innerHTML = `You made your first ${
        allItems[playerItem.rank].label
      }!!`;
    }
  } else textDiv.innerHTML = "Empty hands :(";
}

// spawn and display cells
for (let lat = -SPAWN_AREA; lat < SPAWN_AREA; lat++) {
  for (let lng = -SPAWN_AREA; lng < SPAWN_AREA; lng++) {
    if (luck([lat, lng].toString()) < CACHE_SPAWN_PROBABILITY) {
      const item = spawn(lat, lng);
      let opacity: number = 1.0;
      let interactive: boolean = true;
      const location: leaflet.LatLng = leaflet.latLng([
        start_pos.lat + lat * CELL_SIZE,
        start_pos.lng + lng * CELL_SIZE,
      ]);
      if (map.distance(location, playerPos) * .00001 > PLAYER_REACH) {
        opacity = .5;
        interactive = false;
      }

      const marker = leaflet.circle([
        start_pos.lat + lat * CELL_SIZE,
        start_pos.lng + lng * CELL_SIZE,
      ], {
        radius: 5,
        opacity: opacity,
        weight: 2.5,
        color: "#2a5596ff",
        interactive: interactive,
      }).addTo(map);

      marker.bindTooltip(
        `${allItems[item.rank].label} <br> (${location.lat}, ${location.lng})`,
        { direction: "top" },
      );

      const cell: Cell = {
        item: item,
        location: location,
        marker: marker,
        tooltip: marker.getTooltip()!,
      };

      marker.addEventListener("click", () => {
        if (playerItem == null) actions.pickUp(cell);
        else if (cell.item == null) actions.placeDown(cell);
        else if (playerItem.rank == cell.item.rank) actions.craft(cell);
        updateText();
      });
    }
  }
}

map.addEventListener("moveend", () => {
  playerPos = map.getCenter();
  console.log(playerPos);
  playerMarker.setLatLng(playerPos);
  displayCells();
});

function displayCells() {
}

map.setView(start_pos);
