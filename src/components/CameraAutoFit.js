// CameraAutoFit.js
// Automatyczne ustawianie pozycji i zooma kamery do podanych wymiarów ładowni

export function autoFitCamera(camera, controls, dims, size) {
  if (!camera || !controls) return;

  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();

  const maxDim = Math.max(dims.length, dims.width, dims.height);
  const distance = maxDim * 1.2;
  const center = [
    dims.length / 2,
    dims.height / 2,
    dims.width / 2
  ];

  camera.position.set(
    center[0] + distance,
    center[1] + distance * 0.5,
    center[2] + distance
  );
  camera.lookAt(...center);

  controls.state.radius = distance;
  controls.target = { x: center[0], y: center[1], z: center[2] };
  controls.minDistance = maxDim * 0.5;
  controls.maxDistance = maxDim * 8;
  controls.update();
}
