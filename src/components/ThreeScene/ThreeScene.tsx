import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const ThreeScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  const cubeRef = useRef<THREE.Mesh | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  const [lightIntensity, setLightIntensity] = useState(1);
  const [lightColor, setLightColor] = useState('#ffffff');
  const [cubeColor, setCubeColor] = useState('#44aa88');

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100,
    );
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/brick_diffuse.jpg');

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: texture }));
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: cubeColor }));
    cube.position.y = 0.5;
    cube.castShadow = true;
    scene.add(cube);
    cubeRef.current = cube;

    const pyramid = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0xff8844 }),
    );
    pyramid.position.set(2, 0.75, 0);
    pyramid.castShadow = true;
    scene.add(pyramid);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x4488ff }),
    );
    sphere.position.set(-2, 0.5, 0);
    sphere.castShadow = true;
    scene.add(sphere);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const dirLight = new THREE.DirectionalLight(lightColor, lightIntensity);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    scene.add(new THREE.PointLight(0xff0000, 1, 10));

    const animate = () => {
      cube.rotation.y += 0.01;
      pyramid.rotation.y -= 0.01;

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      camera.aspect = mountRef.current!.clientWidth / mountRef.current!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (cubeRef.current) {
      (cubeRef.current.material as THREE.MeshStandardMaterial).color.set(cubeColor);
    }
  }, [cubeColor]);

  useEffect(() => {
    if (dirLightRef.current) {
      dirLightRef.current.intensity = lightIntensity;
      dirLightRef.current.color.set(lightColor);
    }
  }, [lightIntensity, lightColor]);

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <label>
          Интенсивность света
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={lightIntensity}
            onChange={(e) => setLightIntensity(+e.target.value)}
          />
        </label>

        <label style={{ marginLeft: 20 }}>
          Цвет света
          <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} />
        </label>

        <label style={{ marginLeft: 20 }}>
          Цвет куба
          <input type="color" value={cubeColor} onChange={(e) => setCubeColor(e.target.value)} />
        </label>
      </div>

      <div ref={mountRef} style={{ width: '100%', height: '600px' }} />
    </>
  );
};
