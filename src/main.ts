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

// background map
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
  location: { i: number; j: number };
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

const playerPos: leaflet.LatLng = origin;
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
    console.log("hold");
    const item: Item | null = cell.item;
    playerItem = {
      name: item!.name,
      label: item!.label,
      rank: item!.rank,
    };
    cell.item = null;
    cell.tooltip.setOpacity(0);
    console.log(playerItem);
    console.log(cell.item);
  },
  placeDown: (cell: Cell) => {
    console.log("place");
    const tooltip = cell.tooltip;
    cell.item = {
      name: playerItem!.name,
      label: playerItem!.label,
      rank: playerItem!.rank,
    };
    tooltip.setOpacity(0.9);
    tooltip.setContent(allItems[cell.item!.rank].label);
    playerItem = null;
    console.log(playerItem);
    console.log(cell.item);
  },
  craft: (cell: Cell) => {
    console.log("craft");
    cell.tooltip.setOpacity(0);
    const rank = playerItem!.rank + 1;
    playerItem = {
      name: allItems[rank].name,
      label: allItems[rank].label,
      rank: rank,
    };
    cell.item = null;
    console.log(playerItem);
    console.log(cell.item);
  },
};

function spawn(i: number, j: number) {
  console.log(i, j);
  const value = Math.floor(luck([i, j, "initialValue"].toString()) * 5);
  const item: Item = {
    name: allItems[value].name,
    label: allItems[value].label,
    rank: value,
  };
  return item;
}

function isFar(degree: number) {
  return (degree > 0 && degree > PLAYER_REACH) ||
    (degree < 0 && degree < -PLAYER_REACH);
}

function updateText() {
  if (playerItem != null) {
    textDiv.innerHTML = `Holding ${playerItem.name} ${
      allItems[playerItem.rank].label
    }`;
    if (playerItem.rank == 4) {
      textDiv.innerHTML = `You made your first ${
        allItems[playerItem.rank].label
      }!!`;
    }
  } else textDiv.innerHTML = "Empty hands :(";
}

// spawn and display cells
for (let i = -SPAWN_AREA; i < SPAWN_AREA; i++) {
  for (let j = -SPAWN_AREA; j < SPAWN_AREA; j++) {
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      const item = spawn(i, j);
      let opacity: number = 1.0;
      let interactive: boolean = true;
      const distLat = playerPos.lat - (origin.lat + i * CELL_SIZE);
      const distLng = playerPos.lng - (origin.lng + j * CELL_SIZE);
      if (isFar(distLat) || isFar(distLng)) {
        opacity = .5;
        interactive = false;
      }

      const marker = leaflet.circle([
        origin.lat + i * CELL_SIZE,
        origin.lng + j * CELL_SIZE,
      ], {
        radius: 5,
        opacity: opacity,
        weight: 2.5,
        color: "#2a5596ff",
        interactive: interactive,
      }).addTo(map);

      marker.bindTooltip(allItems[item.rank].label, { direction: "top" });

      const cell: Cell = {
        item: item,
        location: { i, j },
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
