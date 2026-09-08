import { MapRenderer } from "./map-renderer.js";

const cityView = {
  longitude: -122.4175,
  latitude: 37.765,
  height: 1850,
  heading: 12,
  pitch: -34,
};

const map = new MapRenderer("cesiumContainer", {
  terrain: true,
  buildings: true,
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3Njk2YmZlOC0zMWNjLTQyNTgtOTM2OS1jYjU4MzlhZTI0YmMiLCJpZCI6Mzg2ODIyLCJpYXQiOjE3NzAxODYyMTN9.JCPJLbAvrgzStKuTzzrxFss2FHwv8p634oMBKdE7bO8",
});

const status = document.querySelector("#mapStatus");

try {
  await map.initialize();
  map.flyTo(cityView, 0);
  status.querySelector("span:last-child").textContent = "City ready";
  window.setTimeout(() => status.classList.add("is-ready"), 900);
} catch (error) {
  console.error("Map failed to load", error);
  status.querySelector("span:last-child").textContent = "Map data unavailable";
  status.querySelector(".status-dot").style.background = "#ffb36b";
}

document.querySelector("#homeButton").addEventListener("click", () => {
  map.isTopDown = false;
  map.flyTo(cityView, 1.4);
});

document.querySelector("#viewButton").addEventListener("click", () => map.toggleView(cityView));
