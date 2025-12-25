// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const ThreeScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitRef = useRef<OrbitControls | null>(null);
  const transformRef = useRef<TransformControls | null>(null);

  const [lightIntensity, setLightIntensity] = useState(1);
  const [lightColor, setLightColor] = useState('#ffffff');
  const [cubeColor, setCubeColor] = useState('#44aa88');

  const [pos, setPos] = useState([0, 0, 0]);
  const [rot, setRot] = useState([0, 0, 0]);
  const [scale, setScale] = useState([1, 1, 1]);
  const [selectedName, setSelectedName] = useState('');

  const selectedRef = useRef<THREE.Object3D | null>(null);
  const originalMaterialRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

  const highlightObject = (obj: THREE.Object3D | null) => {
    originalMaterialRef.current.forEach((mat, o) => {
      if ((o as THREE.Mesh).material) (o as THREE.Mesh).material = mat;
    });
    originalMaterialRef.current.clear();

    if (!obj) return;

    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        originalMaterialRef.current.set(mesh, mesh.material);
        const highlightMat = (mesh.material as THREE.Material).clone();
        (highlightMat as THREE.MeshStandardMaterial).color = new THREE.Color(0xffff00);
        mesh.material = highlightMat;
      }
    });
  };

  const syncTransformUI = (obj: THREE.Object3D) => {
    setPos([obj.position.x, obj.position.y, obj.position.z]);
    setRot([
      THREE.MathUtils.radToDeg(obj.rotation.x),
      THREE.MathUtils.radToDeg(obj.rotation.y),
      THREE.MathUtils.radToDeg(obj.rotation.z),
    ]);
    setScale([obj.scale.x, obj.scale.y, obj.scale.z]);
  };

  const applyTransform = () => {
    const obj = selectedRef.current;
    if (!obj) return;
    obj.position.set(...pos);
    obj.rotation.set(
      THREE.MathUtils.degToRad(rot[0]),
      THREE.MathUtils.degToRad(rot[1]),
      THREE.MathUtils.degToRad(rot[2]),
    );
    obj.scale.set(...scale);
  };

  const loadModel = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      new GLTFLoader().parse(reader.result as ArrayBuffer, '', (gltf) => {
        const model = gltf.scene;
        model.name = file.name.split('.')[0];
        model.position.set(3, 0, 3); // размещаем сбоку
        model.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) c.castShadow = true;
        });
        sceneRef.current!.add(model);
      });
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbitRef.current = orbit;

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(1.5);
    transform.showX = true;
    transform.showY = true;
    transform.showZ = true;
    transform.addEventListener('dragging-changed', (event) => {
      orbit.enabled = !event.value;
    });
    transform.addEventListener('objectChange', () => {
      if (selectedRef.current) syncTransformUI(selectedRef.current);
    });
    scene.add(transform);
    transformRef.current = transform;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dirLight = new THREE.DirectionalLight(lightColor, lightIntensity);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff0000, 1, 10);
    scene.add(pointLight);

    // Plane
    const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/brick_diffuse.jpg');
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: texture }));
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Cube
    const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: cubeColor }));
    cube.position.y = 0.5;
    cube.castShadow = true;
    scene.add(cube);

    // Pyramid
    const pyramid = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0xff8844 }),
    );
    pyramid.position.set(2, 0.75, 0);
    pyramid.castShadow = true;
    scene.add(pyramid);

    // Sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x4488ff }),
    );
    sphere.position.set(-2, 0.5, 0);
    sphere.castShadow = true;
    scene.add(sphere);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, true);

      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj.parent && obj.parent !== scene) obj = obj.parent;

        selectedRef.current = obj;
        setSelectedName(obj.name || obj.type);
        transform.attach(obj);
        syncTransformUI(obj);
        highlightObject(obj);
      } else {
        selectedRef.current = null;
        setSelectedName('');
        transform.detach();
        highlightObject(null);
      }
    };
    renderer.domElement.addEventListener('pointerdown', onClick);

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
        loadModel(file);
      }
    };
    renderer.domElement.addEventListener('dragover', onDragOver);
    renderer.domElement.addEventListener('drop', onDrop);

    const animate = () => {
      orbit.update();
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
      renderer.domElement.removeEventListener('pointerdown', onClick);
      renderer.domElement.removeEventListener('dragover', onDragOver);
      renderer.domElement.removeEventListener('drop', onDrop);
      transform.dispose();
      orbit.dispose();
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (selectedRef.current) applyTransform();
  }, [pos, rot, scale]);

  useEffect(() => {
    // cube color
    sceneRef.current?.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj === selectedRef.current) return;
      if ((obj as THREE.Mesh).isMesh && obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BoxGeometry) {
        (obj.material as THREE.MeshStandardMaterial).color.set(cubeColor);
      }
    });
  }, [cubeColor]);

  useEffect(() => {
    sceneRef.current?.traverse((obj) => {
      if ((obj as THREE.Light).isLight && obj instanceof THREE.DirectionalLight) {
        obj.intensity = lightIntensity;
        obj.color.set(lightColor);
      }
    });
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

      <div style={{ marginBottom: 10 }}>
        <p style={{ color: '#ccc' }}>Загрузите модель через input или перетащите (.gltf / .glb) на сцену</p>
        <input type="file" accept=".gltf,.glb" onChange={(e) => e.target.files && loadModel(e.target.files[0])} />
        <button style={{ marginLeft: 10, padding: '5px 10px', cursor: 'pointer' }}>
          <a href="https://disk.yandex.ru/d/R-U1d4DRAdxQ-g" style={{ color: 'inherit', textDecoration: 'none' }}>
            Скачать модель для теста
          </a>
        </button>
      </div>

      <div style={{ marginBottom: 10, border: '1px solid #ccc', padding: 10, borderRadius: 5 }}>
        <h4>Выбран: {selectedName}</h4>
        <div>
          <strong>Position:</strong>
          {pos.map((v, i) => (
            <input
              key={i}
              type="number"
              step={0.1}
              value={v}
              onChange={(e) => {
                const n = [...pos];
                n[i] = +e.target.value;
                setPos(n);
              }}
            />
          ))}
        </div>
        <div>
          <strong>Rotation (deg):</strong>
          {rot.map((v, i) => (
            <input
              key={i}
              type="number"
              step={1}
              value={v}
              onChange={(e) => {
                const n = [...rot];
                n[i] = +e.target.value;
                setRot(n);
              }}
            />
          ))}
        </div>
        <div>
          <strong>Scale:</strong>
          {scale.map((v, i) => (
            <input
              key={i}
              type="number"
              step={0.1}
              value={v}
              onChange={(e) => {
                const n = [...scale];
                n[i] = +e.target.value;
                setScale(n);
              }}
            />
          ))}
        </div>
      </div>

      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '600px',
          border: '2px dashed #888',
          borderRadius: 10,
          backgroundColor: '#111',
        }}
      />
    </>
  );
};
