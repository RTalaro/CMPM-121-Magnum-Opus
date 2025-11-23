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

const left = document.createElement("button");
left.id = "left";
left.textContent = "⬅";
const down = document.createElement("button");
down.id = "down";
down.textContent = "⬇︎";
const right = document.createElement("button");
right.id = "right";
right.textContent = "➡";

const latMov = 0.00017137304;
const lngMov = 0.00021457672;
const allButtons = {
  up: "⬆",
  left: "⬅",
  down: "⬇︎",
  right: "➡",
};
console.log(allButtons["up"]);
for (const direction in allButtons) {
  console.log(direction, typeof(direction));
  const button = document.createElement("button");
  button.id = direction;
  button.textContent = allButtons[direction];
  document.body.append(button);
  if (direction == "up") {
    const buttonsDiv = document.createElement("div");
    document.body.append(buttonsDiv);
  }
  button.addEventListener("click", () => {
    switch (direction) {
      case "up":
        playerPos.lat += latMov;
        break;
      case "down":
        playerPos.lat -= latMov;
        break;
      case "left":
        playerPos.lng -= lngMov;
        break;
      case "right":
        playerPos.lng += lngMov;
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
const SPAWN_AREA = 1e6;
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

// define intrinsic state
interface ItemType {
  name: string;
  label: string;
  rank: number;
}

// save memory by referencing shared itemType instances instead of copying data
interface Cell {
  item: ItemType | null;
  location: leaflet.LatLng;
  marker: leaflet.Circle;
  tooltip: Tooltip;
}

// define flyweight pool
const allItems: ItemType[] = [
  { name: "letter", label: "O", rank: 0 },
  { name: "word", label: "DO", rank: 1 },
  { name: "clause", label: "DO YOU", rank: 2 },
  { name: "sentence", label: "YOU DON'T READ, DO YOU?", rank: 3 },
  { name: "paragraph", label: "¶", rank: 4 },
  { name: "paper", label: "📄", rank: 5 },
  { name: "novel", label: "📕", rank: 6 },
  { name: "series", label: "📚", rank: 7 },
];

let visibleCells: Cell[] = [];

const FINAL_ITEM: string = "paper";
let playerPos: leaflet.LatLng = start_pos;
const playerIcon = leaflet.icon({
  iconUrl: faceImg,
  iconSize: [78.3, 49.2], // 10% of original img size
});
const playerMarker = leaflet.marker(playerPos, { icon: playerIcon });
playerMarker.addTo(map);
let playerItem: ItemType | null = null;
textDiv.innerHTML = "Empty hand :(";

type Action = (cell: Cell) => void;
const actions: Record<string, Action> = {
  pickUp: (cell: Cell) => {
    const item: ItemType = cell.item!;
    playerItem = allItems[item.rank];
    cell.item = null;
    cell.tooltip.setOpacity(0);
  },
  placeDown: (cell: Cell) => {
    const tooltip = cell.tooltip;
    cell.item = allItems[playerItem!.rank];
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
    playerItem = allItems[rank];
    cell.item = null;
  },
};

// save memory by returning reference to itemType instead of instancing new item
function spawn(lat: number, lng: number) {
  const value = Math.floor(luck([lat, lng, "initialValue"].toString()) * 5);
  const item: ItemType = allItems[value];
  return item;
}

function updateText() {
  if (playerItem != null) {
    textDiv.innerHTML = `Holding ${playerItem.name} ${
      allItems[playerItem.rank].label
    }`;
    if (playerItem.name == FINAL_ITEM) {
      textDiv.innerHTML = `You wrote a ${allItems[playerItem.rank].label}!!`;
    }
  } else textDiv.innerHTML = "Empty hands :(";
}

// spawn and display cells

map.addEventListener("moveend", () => {
  playerPos = map.getCenter();
  playerMarker.setLatLng(playerPos);
  killOldCells();
  displayCells();
});

function killOldCells() {
  for (const cell of visibleCells) {
    if (isOffMap(cell.location)) {
      // direct mutation to cellGrid to preserve and restore modified cell states
      if (!isModified(cell)) {
        visibleCells = visibleCells.filter((item) => item !== cell);
      }
      cell.marker.removeFrom(map);
    } else if (map.distance(cell.location, playerPos) * .00001 > PLAYER_REACH) {
      cell.marker.setStyle({ opacity: .5, interactive: false });
      cell.marker.redraw();
    } else {
      cell.marker.setStyle({ opacity: 1.0, interactive: true });
      cell.marker.bindTooltip(cell.tooltip);
      cell.marker.redraw();
    }
  }
  console.log("after filter,", visibleCells);
}

function isModified(cell: Cell) {
  if (cell.item == null) return false;
  const origRank: number = Math.floor(
    luck(
      [cell.location.lat, cell.location.lng, "initialValue"].toString(),
    ) * 5,
  );
  const currRank: number = cell.item!.rank;
  return origRank == currRank;
}

const cellGrid = leaflet.layerGroup();
function displayCells() {
  cellGrid.clearLayers();
  if (map.getZoom() < 18) return;
  const bounds: leaflet.LatLngBounds = map.getBounds();

  for (let lat = -SPAWN_AREA; lat < SPAWN_AREA; lat++) {
    if (
      (start_pos.lat + lat * CELL_SIZE < bounds.getSouth()) ||
      (start_pos.lat + lat * CELL_SIZE > bounds.getNorth())
    ) continue;
    for (let lng = -SPAWN_AREA; lng < SPAWN_AREA; lng++) {
      if (
        (start_pos.lng + lng * CELL_SIZE < bounds.getWest()) ||
        (start_pos.lng + lng * CELL_SIZE > bounds.getEast())
      ) continue;

      if (luck([lat, lng].toString()) >= CACHE_SPAWN_PROBABILITY) continue;
      const item = spawn(lat, lng);
      let opacity: number = 1.0;
      let interactive: boolean = true;
      const location: leaflet.LatLng = leaflet.latLng([
        start_pos.lat + lat * CELL_SIZE,
        start_pos.lng + lng * CELL_SIZE,
      ]);
      let cont = true;
      for (const cell of visibleCells) {
        if (
          cell.location.lat == location.lat &&
          cell.location.lng == location.lng
        ) {
          cont = false;
          break;
        }
      }
      if (!cont) continue;
      else if (map.distance(location, playerPos) * .00001 > PLAYER_REACH) {
        opacity = .5;
        interactive = false;
      }

      const marker = createMarker(location, opacity, interactive, item);
      const cell: Cell = {
        item: item,
        location: location,
        marker: marker,
        tooltip: marker.getTooltip()!,
      };

      updateCellVisibility(cell);
      onCellClick(cell);
    }
  }

  for (const cell of visibleCells) {
    cell.marker.addTo(cellGrid);
  }
  cellGrid.addTo(map);
}

function isOffMap(location: leaflet.LatLng) {
  const bounds = map.getBounds();
  const isFarLat = (location.lat < bounds.getSouth()) ||
    (location.lat > bounds.getNorth());
  const isFarLng = (location.lng < bounds.getWest()) ||
    (location.lng > bounds.getEast());
  return (isFarLat || isFarLng);
}

function createMarker(
  location: leaflet.LatLng,
  opacity: number,
  interactive: boolean,
  item: ItemType,
) {
  const marker = leaflet.circle(location, {
    radius: 5,
    opacity: opacity,
    weight: 2.5,
    color: "#2a5596ff",
    interactive: interactive,
  });

  marker.bindTooltip(
    `${allItems[item.rank].label} <br> (${location.lat}, ${location.lng})`,
    { direction: "top" },
  );
  return marker;
}

function updateCellVisibility(cell: Cell) {
  if (
    !(visibleCells.some((visibleCells) =>
      visibleCells.location === cell.location
    ))
  ) {
    visibleCells.push(cell);
    cell.marker.addTo(cellGrid);
  } else cell.marker.removeFrom(map);
}

function onCellClick(cell: Cell) {
  cell.marker.addEventListener("click", () => {
    if (playerItem == null) actions.pickUp(cell);
    else if (cell.item == null) actions.placeDown(cell);
    else if (playerItem.rank == cell.item.rank) actions.craft(cell);
    updateText();
  });
}

map.setView(start_pos);
