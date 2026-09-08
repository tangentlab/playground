/** A small, reusable boundary around Cesium's general map rendering. */
export class MapRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.viewer = null;
    this.isTopDown = false;
  }

  async initialize() {
    const { accessToken, terrain = true, buildings = true } = this.options;
    if (accessToken) Cesium.Ion.defaultAccessToken = accessToken;

    this.viewer = new Cesium.Viewer(this.container, {
      terrain: terrain ? Cesium.Terrain.fromWorldTerrain() : undefined,
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
    });

    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = true;
    this.viewer.scene.skyAtmosphere.show = true;
    this.viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;

    if (buildings) {
      const tileset = await Cesium.createOsmBuildingsAsync();
      this.viewer.scene.primitives.add(tileset);
    }

    return this;
  }

  flyTo(view, duration = 2.2) {
    const { longitude, latitude, height, heading = 0, pitch = -30, roll = 0 } = view;
    return this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: Cesium.Math.toRadians(roll),
      },
      duration,
    });
  }

  toggleView(obliqueView) {
    this.isTopDown = !this.isTopDown;
    return this.flyTo(this.isTopDown ? { ...obliqueView, height: 5200, pitch: -90 } : obliqueView, 1.4);
  }
}
