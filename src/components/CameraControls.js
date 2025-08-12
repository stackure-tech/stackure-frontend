// CameraControls.js
// Lekki własny kontroler kamery do Three.js (obrót i zoom)

export class CameraControls {
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = options.target || { x: 0, y: 0, z: 0 };

    // ustawienia limitów
    this.minPolarAngle = options.minPolarAngle ?? (10 * Math.PI / 180); // ~10°
    this.maxPolarAngle = options.maxPolarAngle ?? (80 * Math.PI / 180); // ~80°
    this.minDistance = options.minDistance ?? 4;
    this.maxDistance = options.maxDistance ?? 100;

    // stan
    this.state = { rotating: false, lastX: 0, lastY: 0, theta: 0.6, phi: 1.15, radius: 20 };

    // bind eventy
    this.domElement.addEventListener("mousedown", this.onMouseDown);
    // Dodajemy passive: false, by móc blokować scroll
    this.domElement.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);

    this.update();
  }

  dispose = () => {
    this.domElement.removeEventListener("mousedown", this.onMouseDown);
    this.domElement.removeEventListener("wheel", this.onWheel, { passive: false });
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
  };

  getSpherical = () => {
    const dx = this.camera.position.x - this.target.x;
    const dy = this.camera.position.y - this.target.y;
    const dz = this.camera.position.z - this.target.z;
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const theta = Math.atan2(dx, dz);
    const phi = Math.acos(dy / r);
    return { radius: r, theta, phi };
  };

  onMouseDown = (e) => {
    if (window.__blockCameraControls) return;
    if (e.button !== 0) return;
    this.state.rotating = true;
    this.state.lastX = e.clientX;
    this.state.lastY = e.clientY;
    const s = this.getSpherical();
    this.state.theta = s.theta;
    this.state.phi = s.phi;
    this.state.radius = s.radius;
  };

  onMouseMove = (e) => {
    if (window.__blockCameraControls) return;
    if (!this.state.rotating) return;
    const deltaX = e.clientX - this.state.lastX;
    const deltaY = e.clientY - this.state.lastY;
    this.state.lastX = e.clientX;
    this.state.lastY = e.clientY;

    // Horyzontalnie - theta: -180/+180 stopni (pełen obrót)
    this.state.theta += deltaX * 0.008;

    // Wertykalnie - phi: ograniczenia do 10-80°
    this.state.phi -= deltaY * 0.01;
    this.state.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.state.phi));
    this.update();
  };

  onMouseUp = () => {
    if (window.__blockCameraControls) return;
    this.state.rotating = false;
  };

  onWheel = (e) => {
    if (window.__blockCameraControls) return;
    e.preventDefault(); // BLOKUJ SCROLL STRONY!
    this.state.radius += e.deltaY * 0.1;
    this.state.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.state.radius));
    this.update();
  };

  update = () => {
    const { theta, phi, radius } = this.state;
    const x = this.target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = this.target.y + radius * Math.cos(phi);
    const z = this.target.z + radius * Math.sin(phi) * Math.cos(theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target.x, this.target.y, this.target.z);
  };
}
