declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera } from 'three';

  export class OrbitControls {
    constructor(camera: Camera, domElement?: HTMLElement);

    enabled: boolean;
    target: THREE.Vector3;
    enableDamping: boolean;

    update(): void;
    dispose(): void;
  }
}
