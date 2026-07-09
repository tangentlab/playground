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
const buttons = Array.from(document.querySelectorAll("[data-mode]"));
const palette = ["#6bd8e8", "#7ee082", "#f0c15a", "#ef7c8e", "#a98cf0", "#ff9b54", "#9bd3ae"];

const state = {
  amenities: [],
  pathways: [],
  bounds: null,
  pointSprites: [],
  pathwaySprites: [],
  pointLayer: null,
  typeOrder: [],
  hovered: null,
  mode: "pulse",
  selectedType: null,
  pointer: { x: 0, y: 0, active: false },
  time: 0,
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
  rebuildRenderCache();
  updateStats();
  renderTypes();
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

function getCanvasRatio() {
  return Math.min(window.devicePixelRatio || 1, 1.6);
}

function rebuildRenderCache() {
  if (!state.bounds) return;

  state.typeOrder = getTypeCounts().map(([type]) => type);
  state.pointSprites = state.amenities.map((item) => {
    const type = item.properties?.ASSET_TYPE || "OTHER";
    const index = Math.max(0, state.typeOrder.indexOf(type));
    const [x, y] = project(item.geometry.coordinates);

    return {
      item,
      x,
      y,
      type,
      color: palette[index % palette.length],
      detail: item.properties?.DETAILS || item.properties?.ADDRESS || "Regina amenity",
    };
  });

  state.pathwaySprites = state.pathways.map((item) => {
    const surface = item.properties?.SURFACE || "";
    const groups = item.geometry.type === "MultiLineString" ? item.geometry.coordinates : [item.geometry.coordinates];

    return {
      color: surface.includes("CRUSHER") || surface.includes("PAVING") ? "#f0c15a" : "#6bd8e8",
      width: Math.max(1.5, Number(item.properties?.WIDTH) || 2),
      groups: groups.map((coordinates) => coordinates.map(project)),
    };
  });

  rebuildPointLayer();
  updateHover();
}

function rebuildPointLayer() {
  if (!canvas.width || !canvas.height) return;

  if (!state.pointLayer) {
    state.pointLayer = document.createElement("canvas");
  }

  const layer = state.pointLayer;
  layer.width = canvas.width;
  layer.height = canvas.height;
  const layerCtx = layer.getContext("2d");
  layerCtx.clearRect(0, 0, layer.width, layer.height);

  const ratio = getCanvasRatio();
  const primarySize = Math.max(2, 2.6 * ratio);
  const mutedSize = Math.max(1, 1.4 * ratio);
  const selectedOnly = Boolean(state.selectedType);

  layerCtx.fillStyle = "rgba(224, 247, 241, 0.78)";
  for (const point of state.pointSprites) {
    if (selectedOnly && point.type !== state.selectedType) continue;
    layerCtx.fillRect(point.x - primarySize / 2, point.y - primarySize / 2, primarySize, primarySize);
  }

  if (selectedOnly) {
    layerCtx.fillStyle = "rgba(244, 241, 232, 0.12)";
    for (const point of state.pointSprites) {
      if (point.type === state.selectedType) continue;
      layerCtx.fillRect(point.x - mutedSize / 2, point.y - mutedSize / 2, mutedSize, mutedSize);
    }
  }

  if (state.mode === "rings") {
    const ringRadius = 6 * ratio;
    layerCtx.strokeStyle = "rgba(224, 247, 241, 0.32)";
    layerCtx.lineWidth = Math.max(1, ratio);
    for (const point of state.pointSprites) {
      if (selectedOnly && point.type !== state.selectedType) continue;
      layerCtx.beginPath();
      layerCtx.arc(point.x, point.y, ringRadius, 0, Math.PI * 2);
      layerCtx.stroke();
    }
  }
}

function updateStats() {
  document.getElementById("amenityCount").textContent = state.amenities.length.toLocaleString();
  document.getElementById("pathwayCount").textContent = state.pathways.length.toLocaleString();
  document.getElementById("typeCount").textContent = getTypeCounts().length.toLocaleString();
}

function renderTypes() {
  const topTypes = getTypeCounts().slice(0, 8);
  typeList.innerHTML = "";

  topTypes.forEach(([type, count], index) => {
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
      rebuildPointLayer();
      updateHover();
    });
    if (state.selectedType === type) button.classList.add("active");
    typeList.append(button);
  });
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = getCanvasRatio();
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  rebuildRenderCache();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#101815");
  gradient.addColorStop(0.5, "#0a1016");
  gradient.addColorStop(1, "#17121c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(244, 241, 232, 0.035)";
  for (let x = 0; x < canvas.width; x += 42) {
    ctx.fillRect(x, 0, 1, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += 42) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
}

function drawPathways() {
  const ratio = getCanvasRatio();
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const pathway of state.pathwaySprites) {
    ctx.strokeStyle = pathway.color;
    ctx.globalAlpha = state.mode === "flow" ? 0.66 : 0.32;
    ctx.lineWidth = pathway.width * ratio;
    ctx.shadowColor = pathway.color;
    ctx.shadowBlur = state.mode === "flow" ? 10 : 4;

    for (const coordinates of pathway.groups) {
      ctx.beginPath();
      coordinates.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawAmenities() {
  if (state.pointLayer) ctx.drawImage(state.pointLayer, 0, 0);
}

function drawFlowParticles() {
  if (state.mode !== "flow" || !state.pathwaySprites.length) return;
  const ratio = getCanvasRatio();
  ctx.save();
  ctx.fillStyle = "#f4f1e8";
  ctx.shadowColor = "#f4f1e8";
  ctx.shadowBlur = 10;

  state.pathwaySprites.slice(0, 220).forEach((pathway, index) => {
    const coordinates = pathway.groups[0];
    if (!coordinates || coordinates.length < 2) return;
    const phase = (state.time * 0.00008 + index * 0.037) % 1;
    const pointIndex = Math.min(coordinates.length - 2, Math.floor(phase * (coordinates.length - 1)));
    const [x, y] = coordinates[pointIndex];
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(x, y, 1.8 * ratio, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function updateHover() {
  state.hovered = null;
  if (!state.pointer.active || !state.pointSprites.length) return;
  let nearest = null;
  let nearestDistance = Infinity;

  for (const point of state.pointSprites) {
    const distance = Math.hypot(point.x - state.pointer.x, point.y - state.pointer.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = point;
    }
  }

  if (!nearest || nearestDistance > 42 * getCanvasRatio()) return;
  state.hovered = nearest;
  activeLabel.textContent = nearest.type;
  activeDetail.textContent = nearest.detail;
}

function drawHover() {
  if (!state.hovered) return;
  const ratio = getCanvasRatio();

  ctx.save();
  ctx.strokeStyle = "rgba(244, 241, 232, 0.92)";
  ctx.lineWidth = 1.5 * ratio;
  ctx.shadowColor = "#f4f1e8";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(state.hovered.x, state.hovered.y, 15 * ratio, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function frame(time) {
  state.time = time;
  drawBackground();
  if (state.bounds) {
    drawPathways();
    drawFlowParticles();
    drawAmenities();
    drawHover();
  }
  requestAnimationFrame(frame);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    buttons.forEach((item) => item.classList.toggle("active", item === button));
    rebuildPointLayer();
  });
});

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const ratio = getCanvasRatio();
  state.pointer = {
    x: (event.clientX - rect.left) * ratio,
    y: (event.clientY - rect.top) * ratio,
    active: true,
  };
  updateHover();
});

canvas.addEventListener("pointerleave", () => {
  state.pointer.active = false;
  state.hovered = null;
  activeLabel.textContent = state.selectedType || "Regina Civic Pulse";
  activeDetail.textContent = state.selectedType
    ? "Filtered to the selected amenity category."
    : "Parks, amenities, and pathways rendered as a living city instrument.";
});

window.addEventListener("resize", resize);

resize();
loadData();
requestAnimationFrame(frame);
