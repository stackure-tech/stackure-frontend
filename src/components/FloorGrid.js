// FloorGrid.js
import * as THREE from "three";

/**
 * Pełna siatka kwadratów na podłodze (OX × OZ), krok co 10 cm
 * UWAGA: Pierwszy argument to szerokość (X), drugi długość (Z)!
 */
export function createFloorGrid(width, length, step = 10) {
  const group = new THREE.Group();
  const gridColor = new THREE.Color("#233");
  const boldColor = new THREE.Color("#4af2ff");

  // Linie równoległe do OZ (zmienia się X)
  for (let x = 0; x <= width; x += step) {
    const isBold = x % 100 === 0;
    const material = new THREE.LineBasicMaterial({ color: isBold ? boldColor : gridColor });
    const points = [new THREE.Vector3(x, 0.01, 0), new THREE.Vector3(x, 0.01, length)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    line.userData.isAccent = isBold; // 👈 znacznik akcentu co 1m
    group.add(line);
  }

  // Linie równoległe do OX (zmienia się Z)
  for (let z = 0; z <= length; z += step) {
    const isBold = z % 100 === 0;
    const material = new THREE.LineBasicMaterial({ color: isBold ? boldColor : gridColor });
    const points = [new THREE.Vector3(0, 0.01, z), new THREE.Vector3(width, 0.01, z)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    line.userData.isAccent = isBold; // 👈 znacznik akcentu co 1m
    group.add(line);
  }

  group.position.set(0, 0, 0);
  return group;
}
