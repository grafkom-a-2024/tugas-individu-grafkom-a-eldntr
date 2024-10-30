import * as THREE from 'three';
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Input from "./Input";

let cubeTexture = [
    'map/px (2).png',
    'map/nx (2).png',
    'map/py (2).png',
    'map/ny (2).png',
    'map/pz (2).png',
    'map/nz (2).png'
];

export default class Scene {
    constructor({ canvas }) {
        this.canvas = canvas;
        this.init();
        this.render();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 50);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.resize();
        this.setUpEvents();
        this.setupLight();
        this.setupControl();

        this.ambientLight.intensity = 3.0;
        this.clock = new THREE.Clock();
        this.mixer = null;
        this.animations = {}; 
        Input.init();

        const environmentTexture = new THREE.CubeTextureLoader().load(cubeTexture, (texture) => {
            this.scene.background = texture;

            this.OrbitControls.enabled = true;
            this.OrbitControls.enableZoom = true;
            this.OrbitControls.maxPolarAngle = Math.PI; // Allow looking up
            this.OrbitControls.minPolarAngle = 0; // Allow looking down

            let size = 3000;
            this.setupGround(size);

            const fbxLoader = new FBXLoader();
            fbxLoader.load("asset/Sad Idle.fbx", (model) => {
                console.log('Model loaded');
                this.player = model;
                model.position.set(80, 5, 40);

                let scale = 0.1;
                model.scale.set(scale, scale, scale);
                this.scene.add(model);

                this.camera.position.set(model.position.x, model.position.y + 10, model.position.z + 30);
                this.camera.lookAt(model.position);

                this.mixer = new THREE.AnimationMixer(model);

                const animationsToLoad = {
                    idle: "asset/Sad Idle.fbx",
                    jump: "asset/Jumping (1).fbx",
                    run: "asset/Fast Run (1).fbx",
                    walk: "asset/Walking (1).fbx"
                };

                Object.entries(animationsToLoad).forEach(([name, path]) => {
                    fbxLoader.load(path, (anim) => {
                        const clip = anim.animations[0];
                        if (clip) {
                            this.animations[name] = this.mixer.clipAction(clip);
                            console.log(`${name} animation loaded`);
                            if (name === "idle") this.animations.idle.play(); // Play idle by default
                        }
                    }, undefined, (error) => {
                        console.error(`Error loading ${name} animation:`, error);
                    });
                });
            }, undefined, (error) => {
                console.error('Error loading model:', error);
            });
        });
    }

    setupGround(size) {
        const groundTexture = new THREE.TextureLoader().load("/texture/polyesterene.jpg");
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        let tSize = size * 0.09;
        groundTexture.repeat.set(tSize, tSize);
        this.groundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size),
            new THREE.MeshStandardMaterial({
                map: groundTexture
            })
        );
        this.groundMesh.rotateX(-Math.PI * 0.5);
        this.scene.add(this.groundMesh);
    }

    render() {
        this.OrbitControls.update();
        this.renderer.render(this.scene, this.camera);
        this.update();
        Input.clear();

        requestAnimationFrame(() => {
            this.render();
        });
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setUpEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        });
    }

    setupControl() {
        this.OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    setupLight() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(this.ambientLight);

        this.pointLight = new THREE.PointLight(0xffffff, 5000.0);
        this.pointLight.position.set(20, 80, 30);
        this.scene.add(this.pointLight);
    }

    update() {
        if (this.mixer) {
            let delta = this.clock.getDelta();
            this.mixer.update(delta);
            this.OrbitControls.target = this.player.position.clone().add(new THREE.Vector3(0, 40, 0));
            this.player.rotation.set(0, this.OrbitControls.getAzimuthalAngle() + Math.PI, 0);
        }

        let isWalking = false;
        let isSprinting = false;
        let isJumping = false;
        let isMovingLeft = false;
        let isMovingRight = false;
        let isMovingBackward = false;

        /* W Key */
        if (Input.keyDown[87]) {
            if (Input.keyDown[16]) { // Shift key
                isSprinting = true;
            } else {
                isWalking = true;
            }
        }

        /* S Key */
        if (Input.keyDown[83]) {
            isMovingBackward = true;
        }

        /* A Key */
        if (Input.keyDown[65]) {
            isMovingLeft = true;
        }

        /* D Key */
        if (Input.keyDown[68]) {
            isMovingRight = true;
        }

        /* Space Key */
        if (Input.keyDown[32]) {
            isJumping = true;
        }

        if (isJumping) {
            if (this.animations.jump && !this.animations.jump.isRunning()) {
                this.playAnimation("jump");
                console.log('Jump animation played');
            }
        } else if (isSprinting) {
            if (this.animations.run && !this.animations.run.isRunning()) {
                this.playAnimation("run");
                console.log('Run animation played');
            }
            this.player.translateZ(2.0);
            this.camera.translateZ(-2.0);
        } else if (isWalking) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateZ(0.3);
            this.camera.translateZ(-0.3);
        } else if (isMovingBackward) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateZ(-0.3);
            this.camera.translateZ(0.3);
        } else if (isMovingLeft) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateX(-0.3);
            this.camera.translateX(0.3);
        } else if (isMovingRight) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateX(0.3);
            this.camera.translateX(-0.3);
        } else {
            if (this.animations.idle && !this.animations.idle.isRunning()) {
                this.playAnimation("idle");
                console.log('Idle animation played');
            }
        }
    }

    playAnimation(name) {
        Object.keys(this.animations).forEach((key) => {
            if (this.animations[key] && key !== name) this.animations[key].stop();
        });
        if (this.animations[name]) {
            this.animations[name].reset().play();
        }
    }
}