import * as THREE from 'three';
import { chunkMeters, type GameConfig } from '../core/config';
import { type Chunk } from '../chunks/chunk';
import { type MeshData } from '../meshing/greedy';
import { Player } from '../player/controller';

export class Renderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly gl: THREE.WebGLRenderer;
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private readonly sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private readonly resize = () => {
    this.gl.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix();
  };
  constructor(canvas: HTMLCanvasElement, private readonly config: GameConfig) {
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(Math.min(devicePixelRatio, config.graphics.pixelRatioCap));
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping; this.gl.toneMappingExposure = 1.15;
    const distance = config.renderDistance * chunkMeters(config);
    this.camera = new THREE.PerspectiveCamera(config.graphics.fov, 1, 0.035, Math.max(300, distance * 3));
    this.camera.rotation.order = 'YXZ';
    const fogColor = new THREE.Color('#a3afa4');
    this.scene.fog = new THREE.Fog(fogColor, distance * config.graphics.fogNearFraction, distance * config.graphics.fogFarFraction);
    this.scene.background = fogColor;
    this.scene.add(new THREE.HemisphereLight('#d2e4df', '#524530', 2.0));
    const sun = new THREE.DirectionalLight('#ffe4b2', 2.1); sun.position.set(-25, 35, -20); this.scene.add(sun);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(250, 24, 12), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { horizon: { value: fogColor }, zenith: { value: new THREE.Color('#4c7377') } },
      vertexShader: 'varying vec3 vDirection; void main(){ vDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 horizon; uniform vec3 zenith; varying vec3 vDirection;
        void main(){ vec3 d=normalize(vDirection); float h=pow(max(0.0,d.y),0.65);
        vec3 col=mix(horizon,zenith,h); float sun=pow(max(dot(d,normalize(vec3(-25.,35.,-20.))),0.),600.);
        col+=vec3(0.5,0.36,0.18)*sun; gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    }));
    this.sky.frustumCulled = false; this.scene.add(this.sky);
    this.resize(); window.addEventListener('resize', this.resize);
  }
  update(chunk: Chunk, data: MeshData): void {
    this.remove(chunk.key);
    if (!data.indices.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    geometry.computeBoundingSphere(); geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry, this.material), width = chunkMeters(this.config);
    mesh.position.set(chunk.x * width, chunk.y * width, chunk.z * width);
    mesh.scale.setScalar(1 / this.config.voxelsPerMeter);
    this.meshes.set(chunk.key, mesh); this.scene.add(mesh);
  }
  remove(key: string): void {
    const mesh = this.meshes.get(key);
    if (mesh) { this.scene.remove(mesh); mesh.geometry.dispose(); this.meshes.delete(key); }
  }
  draw(player: Player): void {
    const eye = player.eye; this.camera.position.set(eye.x, eye.y, eye.z);
    this.camera.rotation.set(player.pitch, player.yaw, 0);
    this.sky.position.copy(this.camera.position);
    this.gl.render(this.scene, this.camera);
  }
  dispose(): void {
    window.removeEventListener('resize', this.resize);
    for (const key of this.meshes.keys()) this.remove(key);
    this.sky.geometry.dispose(); this.sky.material.dispose(); this.material.dispose(); this.gl.dispose();
  }
}
