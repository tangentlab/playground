// Define object types to cycle through
const objectTypes = [
        { type: 'box', tag: 'a-box', props: 'width="1" height="1" depth="1"' },
        { type: 'sphere', tag: 'a-sphere', props: 'radius="0.5"' },
        { type: 'cylinder', tag: 'a-cylinder', props: 'radius="0.5" height="1"' },
        { type: 'torus', tag: 'a-torus', props: 'radius="0.5" radius-tubular="0.1"' },
        { type: 'octahedron', tag: 'a-octahedron', props: 'radius="0.5"' },
        { type: 'tetrahedron', tag: 'a-tetrahedron', props: 'radius="0.5"' },
        { type: 'cone', tag: 'a-cone', props: 'radius-bottom="0.5" radius-top="0.1" height="1"' },
        { type: 'dodecahedron', tag: 'a-dodecahedron', props: 'radius="0.5"' }
      ];

// Colors to cycle through
const colors = ['#4CC3D9', '#EF2D5E', '#FFC65D', '#7BC8A4', '#9B59B6', '#E74C3C', '#3498DB', '#F39C12'];

// Network tracking
const network = {
  nodes: new Map(), // id -> {element, position, connections: Set}
  connections: new Set(), // Set of connection IDs like "id1-id2"
  connectionDistance: 3.5 // Maximum distance for connections
};

// Update UI
function updateUI() {
  document.getElementById('connection-count').textContent = network.connections.size;
  document.getElementById('node-count').textContent = network.nodes.size;
}

// Calculate distance between two positions
function getDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// Create connection line between two objects
function createConnection(id1, id2, pos1, pos2) {
  return;

  const connectionId = [id1, id2].sort().join('-');

  // Check if connection already exists
  if (network.connections.has(connectionId)) {
    return;
  }

  network.connections.add(connectionId);

  // Calculate distance and direction
  const distance = getDistance(pos1, pos2);
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;

  // Calculate midpoint
  const midX = (pos1.x + pos2.x) / 2;
  const midY = (pos1.y + pos2.y) / 2;
  const midZ = (pos1.z + pos2.z) / 2;

  // Create line entity using a-cylinder
  const lineId = 'line-' + connectionId;
  const line = document.createElement('a-cylinder');
  line.setAttribute('id', lineId);
  line.setAttribute('radius', '0.03');
  line.setAttribute('height', distance);
  line.setAttribute('color', '#00ff88');
  line.setAttribute('opacity', '0.6');
  line.setAttribute('position', midX + ' ' + midY + ' ' + midZ);

  // Calculate rotation to align cylinder from pos1 to pos2
  // First, find the angle in the XZ plane (yaw)
  const yaw = Math.atan2(dx, dz) * 180 / Math.PI;
  // Then, find the pitch angle (elevation)
  const pitch = Math.atan2(-dy, Math.sqrt(dx*dx + dz*dz)) * 180 / Math.PI;

  line.setAttribute('rotation', pitch + ' ' + yaw + ' 0');
  line.setAttribute('class', 'network-line');

  document.querySelector('a-scene').appendChild(line);
  updateUI();
}

// Update connections for a node
function updateConnections(nodeId, position) {
  network.nodes.forEach((node, otherId) => {
    if (otherId !== nodeId && node.position) {
      const distance = getDistance(position, node.position);
      if (distance <= network.connectionDistance) {
        //createConnection(nodeId, otherId, position, node.position);
      }
    }
  });
}

// Register a node in the network
function registerNode(element) {
  const id = element.getAttribute('id');
  const pos = element.getAttribute('position');
  const position = typeof pos === 'object' ? pos : {x: 0, y: 0, z: 0};

  if (!network.nodes.has(id)) {
    network.nodes.set(id, {
      element: element,
      position: position,
      connections: new Set()
    });
  } else {
    // Update position
    network.nodes.get(id).position = position;
    network.nodes.get(id).element = element;
  }

  // Update connections
  updateConnections(id, position);
  updateUI();
}

function transformObject(element) {
  // Get current object type
  const currentTag = element.tagName.toLowerCase();
  let currentType = objectTypes.findIndex(obj => obj.tag === currentTag);

  // If current type not found in cycle list, start from beginning
  if (currentType === -1) {
    currentType = objectTypes.length - 1; // Will cycle to 0 on next line
  }

  // Get next object type (cycle through and loop back to start)
  const nextIndex = (currentType + 1) % objectTypes.length;
  const nextObject = objectTypes[nextIndex];

  // Get current attributes
  const position = element.getAttribute('position');
  const rotation = element.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
  const color = colors[Math.floor(Math.random() * colors.length)];
  const id = element.getAttribute('id') || 'obj-' + Date.now();

  // Preserve scale if it exists
  const scale = element.getAttribute('scale') || { x: 1, y: 1, z: 1 };

  // Create new element
  const newElement = document.createElement(nextObject.tag);
  newElement.setAttribute('id', id);
  newElement.setAttribute('position', position);
  newElement.setAttribute('rotation', rotation);
  newElement.setAttribute('scale', scale);
  newElement.setAttribute('color', color);
  newElement.setAttribute('class', 'clickable');

  // Set specific properties based on object type
  if (nextObject.tag === 'a-box') {
    newElement.setAttribute('width', '1');
    newElement.setAttribute('height', '1');
    newElement.setAttribute('depth', '1');
  } else if (nextObject.tag === 'a-sphere') {
    newElement.setAttribute('radius', '0.5');
  } else if (nextObject.tag === 'a-cylinder') {
    newElement.setAttribute('radius', '0.5');
    newElement.setAttribute('height', '1');
  } else if (nextObject.tag === 'a-torus') {
    newElement.setAttribute('radius', '0.5');
    newElement.setAttribute('radius-tubular', '0.1');
  } else if (nextObject.tag === 'a-octahedron' || nextObject.tag === 'a-tetrahedron' || nextObject.tag === 'a-dodecahedron') {
    newElement.setAttribute('radius', '0.5');
  } else if (nextObject.tag === 'a-cone') {
    newElement.setAttribute('radius-bottom', '0.5');
    newElement.setAttribute('radius-top', '0.1');
    newElement.setAttribute('height', '1');
  }

  // Add animation for smooth transition
  newElement.setAttribute('animation__scale', {
    property: 'scale',
    from: '0 0 0',
    to: '1 1 1',
    dur: 300,
    easing: 'easeOutElastic'
  });

  // Replace the element
  element.parentNode.replaceChild(newElement, element);

  // Register in network and create connections
  registerNode(newElement);

  // Add click listener to new element
  newElement.addEventListener('click', function() {
    transformObject(this);
  });
}

// Initialize network with existing nodes
function initializeNetwork() {
  document.querySelectorAll('.network-node').forEach(function(element) {
    registerNode(element);
  });
}

// Mouse click handler with raycasting
document.querySelector('a-scene').addEventListener('loaded', function() {
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = document.querySelector('#main-camera') || document.querySelector('a-camera');

  // Get Three.js - A-Frame bundles THREE.js
  // THREE should be available globally or through AFRAME
  const THREE = window.THREE || (typeof AFRAME !== 'undefined' && AFRAME.THREE ? AFRAME.THREE : null);

  if (!THREE) {
    console.error('Could not find THREE.js');
    return;
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Add click event listener to the canvas
  const canvas = sceneEl.canvas;

  canvas.addEventListener('click', function(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Get camera object
    const camera = cameraEl.getObject3D('camera');

    // Update raycaster with camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get all clickable objects
    const clickableObjects = [];
    document.querySelectorAll('.clickable').forEach(function(element) {
      if (element.object3D && element.object3D.visible) {
        element.object3D.traverse(function(child) {
          if (child.isMesh) {
            clickableObjects.push(child);
          }
        });
      }
    });

    // Check for intersections
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
      // Find the A-Frame entity that contains this mesh
      const clickedMesh = intersects[0].object;
      let aframeEntity = null;

      // Search through all clickable entities to find which one contains this mesh
      document.querySelectorAll('.clickable').forEach(function(el) {
        if (el.object3D && !aframeEntity) {
          el.object3D.traverse(function(child) {
            if (child === clickedMesh && !aframeEntity) {
              aframeEntity = el;
            }
          });
        }
      });

      if (aframeEntity) {
        transformObject(aframeEntity);
      }
    }
  });

  // Initialize network
  initializeNetwork();
});