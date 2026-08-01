const DATASETS = {
  amenities:
    "https://opengis.regina.ca/arcgis/rest/services/OpenData/ParksAndAmenities/MapServer/1/query",
  pathways:
    "https://opengis.regina.ca/arcgis/rest/services/OpenData/Pathways/MapServer/0/query",
};

const FALLBACK = {
  amenities: [
    feature(-104.615, 50.450, { ASSET_TYPE: "PLAYGROUND", DETAILS: "fallback" }),
    feature(-104.636, 50.466, { ASSET_TYPE: "DOG PARK", DETAILS: "fallback" }),
    feature(-104.588, 50.435, { ASSET_TYPE: "SPRAYPAD", DETAILS: "fallback" }),
    feature(-104.671, 50.471, { ASSET_TYPE: "BALL DIAMOND", DETAILS: "fallback" }),
    feature(-104.602, 50.485, { ASSET_TYPE: "PICNIC SITE", DETAILS: "fallback" }),
  ],
  pathways: [
    line([
      [-104.69, 50.43],
      [-104.64, 50.45],
      [-104.59, 50.48],
      [-104.54, 50.49],
    ], { SURFACE: "ASPHALT", WIDTH: 3 }),
    line([
      [-104.67, 50.49],
      [-104.62, 50.47],
      [-104.58, 50.44],
    ], { SURFACE: "CRUSHER DUST", WIDTH: 2 }),
  ],
};

const canvas = document.getElementById("pulseCanvas");
const ctx = canvas.getContext("2d");
const typeList = document.getElementById("typeList");
const activeLabel = document.getElementById("activeLabel");
const activeDetail = document.getElementById("activeDetail");
const palette = ["#6bd8e8", "#7ee082", "#f0c15a", "#ef7c8e", "#a98cf0", "#ff9b54", "#9bd3ae"];

const state = {
  amenities: [],
  pathways: [],
  bounds: null,
  selectedType: null,
  pointer: { x: 0, y: 0, active: false },
  projectedAmenities: [],
  projectedPathways: [],
  typeColors: new Map(),
  drawPending: false,
};

function feature(lon, lat, properties) {
  return { type: "Feature", geometry: { type: "Point", coordinates: [lon, lat] }, properties };
}

function line(coordinates, properties) {
  return { type: "Feature", geometry: { type: "LineString", coordinates }, properties };
}

function buildQueryUrl(base, offset = 0) {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    outSR: "4326",
    f: "geojson",
    resultOffset: String(offset),
    resultRecordCount: "1000",
  });
  return `${base}?${params.toString()}`;
}

async function fetchLayer(base) {
  const features = [];
  let offset = 0;
  let keepGoing = true;

  while (keepGoing && offset < 5000) {
    const response = await fetch(buildQueryUrl(base, offset));
    if (!response.ok) throw new Error(`OpenData request failed: ${response.status}`);
    const geojson = await response.json();
    features.push(...(geojson.features || []));
    keepGoing = Boolean(geojson.exceededTransferLimit) && geojson.features?.length;
    offset += 1000;
  }

  return features;
}

async function loadData() {
  try {
    const [amenities, pathways] = await Promise.all([
      fetchLayer(DATASETS.amenities),
      fetchLayer(DATASETS.pathways),
    ]);
    state.amenities = amenities.filter((item) => item.geometry?.type === "Point");
    state.pathways = pathways.filter((item) => item.geometry);
    activeLabel.textContent = "Live data loaded";
    activeDetail.textContent = "Rendering directly from City of Regina OpenData feature services.";
  } catch (error) {
    state.amenities = FALLBACK.amenities;
    state.pathways = FALLBACK.pathways;
    activeLabel.textContent = "Live data unavailable";
    activeDetail.textContent = "A tiny local sample is shown until the public endpoint responds again.";
  }

  state.bounds = calculateBounds([...state.amenities, ...state.pathways]);
  cacheGeometry();
  updateStats();
  renderTypes();
  requestDraw();
}

function calculateBounds(features) {
  const xs = [];
  const ys = [];

  for (const item of features) {
    visitCoordinates(item.geometry, ([lon, lat]) => {
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        xs.push(lon);
        ys.push(lat);
      }
    });
  }

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function visitCoordinates(geometry, callback) {
  if (!geometry) return;
  if (geometry.type === "Point") callback(geometry.coordinates);
  if (geometry.type === "LineString") geometry.coordinates.forEach(callback);
  if (geometry.type === "MultiLineString") geometry.coordinates.flat().forEach(callback);
}

function project([lon, lat]) {
  const pad = Math.min(canvas.width, canvas.height) * 0.08;
  const width = canvas.width - pad * 2;
  const height = canvas.height - pad * 2;
  const x = pad + ((lon - state.bounds.minX) / (state.bounds.maxX - state.bounds.minX)) * width;
  const y = pad + (1 - (lat - state.bounds.minY) / (state.bounds.maxY - state.bounds.minY)) * height;
  return [x, y];
}

function getTypeCounts() {
  const counts = new Map();
  for (const item of state.amenities) {
    const type = item.properties?.ASSET_TYPE || "OTHER";
    counts.set(type, (counts.get(type) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function updateStats() {
  document.getElementById("amenityCount").textContent = state.amenities.length.toLocaleString();
  document.getElementById("pathwayCount").textContent = state.pathways.length.toLocaleString();
  document.getElementById("typeCount").textContent = getTypeCounts().length.toLocaleString();
}

function renderTypes() {
  const topTypes = getTypeCounts().slice(0, 8);
  typeList.innerHTML = "";

  for (const [type, count] of topTypes) {
    const index = topTypes.findIndex(([name]) => name === type);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "type-pill";
    button.dataset.type = type;
    button.innerHTML = `
      <span class="swatch" style="background:${palette[index % palette.length]}; color:${palette[index % palette.length]}"></span>
      <span class="type-name">${type}</span>
      <span class="type-count">${count}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedType = state.selectedType === type ? null : type;
      activeLabel.textContent = state.selectedType || "All amenities";
      activeDetail.textContent = state.selectedType
        ? `${count.toLocaleString()} mapped locations in this category.`
        : "Every loaded amenity is active again.";
      renderTypes();
      requestDraw();
    });
    if (state.selectedType === type) button.classList.add("active");
    typeList.append(button);
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  cacheGeometry();
  requestDraw();
}

function drawBackground() {
  ctx.fillStyle = "#101719";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function cacheGeometry() {
  if (!state.bounds) return;
  state.typeColors = new Map(getTypeCounts().map(([type], index) => [type, palette[index % palette.length]]));
  state.projectedAmenities = state.amenities.map((item) => ({ item, point: project(item.geometry.coordinates) }));
  state.projectedPathways = state.pathways.flatMap((item) => {
    const groups = item.geometry.type === "MultiLineString" ? item.geometry.coordinates : [item.geometry.coordinates];
    return groups.map((coordinates) => ({ item, points: coordinates.map(project) }));
  });
}

function drawPathways() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const { item, points } of state.projectedPathways) {
    const surface = item.properties?.SURFACE || "";
    const color = surface.includes("CRUSHER") || surface.includes("PAVING") ? "#f0c15a" : "#6bd8e8";
    const width = Math.max(1.5, Number(item.properties?.WIDTH) || 2);
    ctx.beginPath();
    points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = width * Math.min(window.devicePixelRatio || 1, 1.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAmenities() {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  ctx.save();

  for (const { item, point: [x, y] } of state.projectedAmenities) {
    const type = item.properties?.ASSET_TYPE || "OTHER";
    const selected = !state.selectedType || state.selectedType === type;
    const color = state.typeColors.get(type) || palette[0];
    const radius = (selected ? 3 : 1.5) * ratio;

    ctx.globalAlpha = selected ? 0.9 : 0.16;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

  }

  ctx.restore();
}

function drawHover() {
  if (!state.pointer.active || !state.amenities.length) return;
  let nearest = null;
  let nearestDistance = Infinity;

  for (const { item, point: [x, y] } of state.projectedAmenities) {
    const distance = Math.hypot(x - state.pointer.x, y - state.pointer.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = { item, x, y };
    }
  }

  if (!nearest || nearestDistance > 42 * (window.devicePixelRatio || 1)) return;
  const type = nearest.item.properties?.ASSET_TYPE || "Amenity";
  const detail = nearest.item.properties?.DETAILS || nearest.item.properties?.ADDRESS || "Regina amenity";
  activeLabel.textContent = type;
  activeDetail.textContent = detail;

  ctx.save();
  ctx.strokeStyle = "rgba(244, 241, 232, 0.92)";
  ctx.lineWidth = 1.5 * (window.devicePixelRatio || 1);
  ctx.beginPath();
  ctx.arc(nearest.x, nearest.y, 15 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  drawBackground();
  if (state.bounds) {
    drawPathways();
    drawAmenities();
    drawHover();
  }
}

function requestDraw() {
  if (state.drawPending) return;
  state.drawPending = true;
  requestAnimationFrame(() => {
    state.drawPending = false;
    draw();
  });
}

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  state.pointer = {
    x: (event.clientX - rect.left) * ratio,
    y: (event.clientY - rect.top) * ratio,
    active: true,
  };
  requestDraw();
});

canvas.addEventListener("pointerleave", () => {
  state.pointer.active = false;
  activeLabel.textContent = state.selectedType || "Regina OpenData Map";
  activeDetail.textContent = state.selectedType
    ? "Filtered to the selected amenity category."
    : "Parks, amenities, and pathways from City of Regina OpenData.";
  requestDraw();
});

window.addEventListener("resize", resize);

resize();
loadData();
