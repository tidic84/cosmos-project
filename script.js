import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import getStarfield from "./getStarfield.js";
import { getFresnelMat } from "./getFresnelMat.js";
let focusedPlanet = null;


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.z = 30;

const loader = new THREE.TextureLoader();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );

const starTexture = loader.load('./assets/textures/stars.jpg');
const skybox = new THREE.Mesh(
    new THREE.SphereGeometry(1500, 64, 64), 
    new THREE.MeshBasicMaterial({
        map: starTexture, 
        color: 0x666666, // Assombrir la texture en définissant une couleur de base sombre
        side: THREE.BackSide // Assurez-vous que la texture est visible de l'intérieur de la sphère
    })
);
scene.add(skybox);
const stars = getStarfield({numStars: 10000});
scene.add(stars);

const sunTexture = loader.load('./assets/textures/sun.jpg');
const sun = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshBasicMaterial({map: sunTexture})
);
scene.add(sun);
const sunLight = new THREE.PointLight(0xffffff, 90, 1000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); 
scene.add(ambientLight);

const planets = [
    {name: 'Mercury', distance: 5, size: 0.5, texture: './assets/textures/mercury.jpg', atmosphereColor: 0x000000},
    {name: 'Venus', distance: 10, size: 0.9, texture: './assets/textures/venus.jpg', atmosphereColor: 0xE6B417},
    {name: 'Earth', distance: 13, size: 1, texture: './assets/textures/earth.jpg', atmosphereColor: 0x0088ff},
    {name: 'Mars', distance: 15, size: 0.6, texture: './assets/textures/mars.jpg', atmosphereColor: 0xBA4F38},
    {name: 'Jupiter', distance: 25, size: 2.2, texture: './assets/textures/jupiter.jpg', atmosphereColor: 0xF5EAC8},
    {name: 'Saturn', distance: 35, size: 1.8, texture: './assets/textures/saturn.jpg', atmosphereColor: 0xBBBC7D},
    {name: 'Uranus', distance: 38, size: 1.6, texture: './assets/textures/uranus.jpg', atmosphereColor: 0x1D8065},
    {name: 'Neptune', distance: 40, size: 1.6, texture: './assets/textures/neptune.jpg', atmosphereColor: 0x103486},
];

planets.forEach(planetData => {
    const planetTexture = loader.load(planetData.texture);
    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(planetData.size, 32, 32),
        new THREE.MeshPhongMaterial({map: planetTexture})
    );
    planet.position.x = planetData.distance;
    scene.add(planet);
    planetData.object = planet;
    
    if (planetData.name !== 'Mercury' && planetData.name !== 'Earth') {
        const glowMesh = new THREE.Mesh( 
            new THREE.SphereGeometry(planetData.size + 0.03, 32, 32), 
            getFresnelMat({
                rimHex: planetData.atmosphereColor
            })
        );
        planet.add(glowMesh);
    }

    if (planetData.name === 'Venus') {
        const atmosphereTexture = loader.load('./assets/textures/venus_atmosphere.jpg');
        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(planetData.size + 0.02, 32, 32), 
            new THREE.MeshPhongMaterial({map: atmosphereTexture, transparent: true, opacity: 0.7})
        );
        planet.add(atmosphere);
    }
    if (planetData.name === 'Earth') {
        const moonTexture = loader.load('./assets/textures/moon.jpg');
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 32, 32),
            new THREE.MeshPhongMaterial({map: moonTexture})
        );
        moon.position.x = 1.5;
        planet.add(moon);
        const cloudTexture = loader.load('./assets/textures/earth_clouds.jpg');
        const clouds = new THREE.Mesh(
            new THREE.SphereGeometry(planetData.size + 0.02, 32, 32),
            new THREE.MeshPhongMaterial({
                map: cloudTexture, 
                blending: THREE.AdditiveBlending,
                transparent: true
            })
        );
        planet.add(clouds);
        const fresnelMat = getFresnelMat();
        const glowMesh = new THREE.Mesh( 
            new THREE.SphereGeometry(planetData.size + 0.02, 32, 32), 
            fresnelMat
        );
        planet.add(glowMesh);

    }

    if (planetData.name === 'Saturn') {
        const ringTexture = new THREE.TextureLoader().load('./assets/textures/saturn_ring_alpha.png');
        
        const innerRadius = 3;
        const outerRadius = 5;
        const thetaSegments = 64;
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
        for (let i = 0; i < ringGeometry.attributes.uv.array.length; i += 2) {
            ringGeometry.attributes.uv.array[i] /= thetaSegments;

            ringGeometry.attributes.uv.array[i + 1] = (ringGeometry.attributes.uv.array[i + 1] * (outerRadius - innerRadius) + innerRadius) / outerRadius;
        }
        const ringMaterial = new THREE.MeshPhongMaterial({
            map: ringTexture,
            side: THREE.DoubleSide,
            opacity: 0.1,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(0, 0, 0);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }
});

const focusObject = new THREE.Object3D();
scene.add(focusObject);

let time = Date.now();
let speed = 1.0;

function animate() {
    requestAnimationFrame(animate);
    
    planets.forEach(planetData => {
        time+= speed;
        if (planetData.name !== 'Venus' && planetData.name !== 'Uranus') {
            planetData.object.rotation.y += 0.001;
        }
        planetData.object.position.x = planetData.distance * Math.cos(time / (2000) / planetData.distance);
        planetData.object.position.z = planetData.distance * Math.sin(time / (2000) / planetData.distance);
        if (planetData.name === 'Earth') {
            planetData.object.children[0].position.x = 1.5 * Math.cos(time / 2000 / 1.5);
            planetData.object.children[0].position.z = 1.5 * Math.sin(time / 2000 / 1.5);

            planetData.object.children[1].rotation.y += 0.0005;
        }
    });

    if (focusedPlanet) {
        focusObject.position.copy(focusedPlanet.object.position);
        controls.target.copy(focusObject.position);
    }
    
    controls.update();

    renderer.render(scene, camera);
}

animate();

document.querySelectorAll('#menu button').forEach(button => {
    button.addEventListener('click', event => {
        const planetName = event.target.dataset.planet;

        if (planetName === 'Sun') {
            camera.position.set(0, 0, 10);
            controls.target.set(0, 0, 0);
            focusedPlanet = null;
        } else {
            const planet = planets.find(p => p.name === planetName);
            if (planet) {
                focusedPlanet = planet;
                camera.position.copy(focusedPlanet.object.position).add(new THREE.Vector3(5, 5, 5));
                controls.update();
            }
        }
    });
});

document.querySelector('#speed-slider').addEventListener('input', event => {
    speed = parseFloat(event.target.value);
});