// RapierPhysics.js
import * as RAPIER from "@dimforge/rapier3d";

export class RapierPhysics {
  constructor(gravity = { x: 0, y: -9.81, z: 0 }) {
    this.world = new RAPIER.World(gravity);
    this.bodies = {};
    this.colliders = {};
  }

  addBox(box) {
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        box.x + box.length / 2,
        box.y + box.height / 2,
        box.z + box.width / 2
      )
      .setLinvel(0, 0, 0)
      .setAngvel(0, 0, 0)
      .setCcdEnabled(true);
    const body = this.world.createRigidBody(desc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      box.length / 2,
      box.height / 2,
      box.width / 2
    );
    this.world.createCollider(colliderDesc, body);
    this.bodies[box.id] = body;
    return body;
  }

  removeBox(boxId) {
    const body = this.bodies[boxId];
    if (body) {
      this.world.removeRigidBody(body);
      delete this.bodies[boxId];
    }
  }

  setBoxPosition(boxId, pos) {
    const body = this.bodies[boxId];
    if (body) {
      body.setTranslation(
        {
          x: pos.x,
          y: pos.y,
          z: pos.z
        },
        true
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  }

  setBoxKinematic(boxId, kinematic) {
    const body = this.bodies[boxId];
    if (body) {
      if (kinematic) {
        body.setBodyType(2); // 2 = KinematicPositionBased
      } else {
        body.setBodyType(0); // 0 = Dynamic
      }
    }
  }

  step() {
    this.world.step();
  }

  getBoxPosition(boxId) {
    const body = this.bodies[boxId];
    if (!body) return null;
    const t = body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }
}
