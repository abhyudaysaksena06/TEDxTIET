import { useEffect, useRef } from "react";
import * as THREE from "three";
import useIsPhone from "../../hooks/useIsPhone";
import { PHOTO_ASPECTS, IMAGE_COUNT } from "./galleryPhotos";

/**
 * SphereGallery — photographs you can spin, focus and read.
 *
 * Layout adapts to the viewport:
 *  - DESKTOP: a sphere (Fibonacci lattice, no clustering at the poles).
 *  - PHONE:   a cylinder. A sphere on a narrow portrait screen puts most tiles
 *             at grazing angles where they are unreadable; a carousel-style
 *             cylinder keeps every tile facing out and legible, and maps
 *             naturally onto a one-axis horizontal swipe.
 *
 * Tiles are oriented RADIALLY (face pointing out from the axis/centre) rather
 * than billboarded at the camera, so the body reads as a solid object.
 *
 * Drag is 1:1 with the pointer and carries momentum on release. Velocity is
 * measured in radians-per-second from real elapsed time, and damping is
 * exponential per second, so the feel is identical at 60Hz and 120Hz — the
 * previous version accumulated per-event, which drifted with frame rate.
 *
 * Rotation is a quaternion: aligning an arbitrary tile to the camera is one
 * slerp, where x/y Euler angles would gimbal-lock near the poles.
 */

/**
 * One slot per photograph.
 *
 * Half the slots used to be placeholders held back for new media. The archive
 * that was being held back for has arrived — 114 photographs — so every slot
 * now carries one.
 */
const SLOT_COUNT = IMAGE_COUNT;
const RED = new THREE.Color("#eb0028");
const FRONT = new THREE.Vector3(0, 0, 1); // toward the camera
const UP = new THREE.Vector3(0, 1, 0);

/** Evenly spread N points over a sphere (Fibonacci lattice — no clustering). */
function fibonacciSphere(count: number, radius: number) {
    const points: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2; // 1 -> -1
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        points.push(
            new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
        );
    }
    return points;
}

/** Stacked rings around a vertical axis — the phone layout. */
function cylinderPoints(count: number, radius: number, rows: number, rowGap: number) {
    const points: THREE.Vector3[] = [];
    const perRow = Math.ceil(count / rows);
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        // stagger alternate rows so columns do not line up into visible seams
        const offset = row % 2 ? Math.PI / perRow : 0;
        const theta = (col / perRow) * Math.PI * 2 + offset;
        const y = (row - (rows - 1) / 2) * rowGap;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius));
    }
    return points;
}


interface Link {
    line: THREE.Line;
    pulse: THREE.Mesh;
    curve: THREE.QuadraticBezierCurve3;
    t: number;
    speed: number;
    life: number;
    maxLife: number;
}

interface GalleryProps {
    /** fills the viewport with just the globe — used for the /gallery route */
    fullPage?: boolean;
}

export default function SphereGallery({ fullPage = false }: GalleryProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const isPhone = useIsPhone();

    // the globe owns the viewport on its own page; stop the document scrolling
    // underneath it so the wheel only ever drives zoom
    useEffect(() => {
        if (!fullPage) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [fullPage]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // ---------- layout constants, per form ----------
        const CYL = isPhone;
        const RADIUS = CYL ? 4.2 : 6.4;
        // Half-width of a photo plane, before it is reshaped to its photo.
        // Trimmed when the archive grew to 114 tiles: at the old size the
        // tallest 9:16 frames overlapped their neighbours on both bodies.
        const TILE = CYL ? 0.72 : 0.82;
        const CAM_FAR = CYL ? 11.5 : 15;
        const CAM_NEAR = CYL ? 6.4 : 8.6;

        let width = mount.clientWidth || window.innerWidth;
        let height = mount.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, CAM_FAR);

        // see StageScene: a refused WebGL context throws, and an effect that
        // throws unmounts the whole app. The gallery degrades to its background
        // rather than taking the page down.
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (err) {
            console.warn("TEDxTIET: gallery disabled, no WebGL context available.", err);
            return;
        }
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        const world = new THREE.Group();
        scene.add(world);

        const disposables: { dispose: () => void }[] = [];

        // ---------- dust field ----------
        // The globe used to hang in flat black, which read as "nothing loaded".
        // A shell of faint points well outside the tile radius gives the scene
        // depth and parallax: it counter-rotates slowly, so spinning the globe
        // reads as motion through a space rather than a texture turning.
        // One BufferGeometry + PointsMaterial — a single draw call.
        const DUST_COUNT = CYL ? 320 : 700;
        const dustGeo = new THREE.BufferGeometry();
        {
            const pos = new Float32Array(DUST_COUNT * 3);
            for (let i = 0; i < DUST_COUNT; i++) {
                // random direction, pushed into a shell beyond the photos
                const u = Math.random() * 2 - 1;
                const theta = Math.random() * Math.PI * 2;
                const r = RADIUS * (1.9 + Math.random() * 2.4);
                const s = Math.sqrt(1 - u * u);
                pos[i * 3] = Math.cos(theta) * s * r;
                pos[i * 3 + 1] = u * r;
                pos[i * 3 + 2] = Math.sin(theta) * s * r;
            }
            dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        }
        const dustMat = new THREE.PointsMaterial({
            color: 0xff5068,
            size: 0.055,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const dust = new THREE.Points(dustGeo, dustMat);
        scene.add(dust);
        disposables.push(dustGeo, dustMat);
        const positions = CYL
            ? cylinderPoints(SLOT_COUNT, RADIUS, 8, TILE * 2.3)
            : fibonacciSphere(SLOT_COUNT, RADIUS);
        const tiles: THREE.Mesh[] = [];

        // ---------- photo tiles ----------
        const loader = new THREE.TextureLoader();
        const maxAniso = renderer.capabilities.getMaxAnisotropy();

        /**
         * A plane shaped like the photo it will carry, at a constant area.
         *
         * One shared landscape plane stretched every portrait frame to fit,
         * and a third of this archive is portrait. Constant area rather than
         * constant height, so an upright frame and a wide one take the same
         * share of the body and the tiles stay evenly spread. Shapes bucket to
         * 2%, so 114 tiles share a couple of dozen geometries.
         */
        const geoCache = new Map<number, THREE.PlaneGeometry>();
        const TILE_AREA = TILE * 2 * (TILE * 1.35);
        const tileGeoFor = (aspect: number) => {
            const key = Math.round(aspect * 50) / 50;
            let geo = geoCache.get(key);
            if (!geo) {
                const w = Math.sqrt(TILE_AREA * key);
                geo = new THREE.PlaneGeometry(w, TILE_AREA / w);
                geoCache.set(key, geo);
                disposables.push(geo);
            }
            return geo;
        };

        /**
         * Resting orientation: face pointing radially outward, upright.
         *
         * lookAt degenerates when the facing direction is parallel to the up
         * reference, which is exactly what happens at the sphere's poles — the
         * tiles there came out arbitrarily rolled. Near a pole the reference
         * swaps to FRONT, which is perpendicular there, so every tile gets a
         * sensible upright.
         */
        const restQuat = (outward: THREE.Vector3) => {
            const up = Math.abs(outward.dot(UP)) > 0.95 ? FRONT : UP;
            return new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(new THREE.Vector3(), outward, up)
            );
        };

        positions.forEach((pos, i) => {
            const photoIndex = i + 1;

            const mat = new THREE.MeshBasicMaterial({
                color: 0x8a8a8a,
                map: null,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(tileGeoFor(PHOTO_ASPECTS[i] ?? 1.48), mat);
            mesh.userData.photoIndex = photoIndex;
            mesh.position.copy(pos);

            // On the cylinder "outward" ignores Y (out from the vertical axis);
            // on the sphere it is straight out from the centre.
            const outward = CYL
                ? new THREE.Vector3(pos.x, 0, pos.z).normalize()
                : pos.clone().normalize();
            mesh.userData.outward = outward;
            mesh.quaternion.copy(restQuat(outward));

            world.add(mesh);
            tiles.push(mesh);
            disposables.push(mat);

            // Every tile holds a texture at once, so these are the small
            // tier. At full size 114 maps would cost roughly 350MB of GPU
            // memory and shut phones out; the focused tile fetches its own
            // full-size map, which is the only place the detail is visible.
            loader.load(
                `/Gallery/thumb/img${photoIndex}.webp`,
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = maxAniso;
                    mesh.userData.thumbTex = tex;
                    mat.map = tex;
                    mat.color.set(0xffffff);
                    mat.needsUpdate = true;
                    disposables.push(tex);
                },
                undefined,
                () => {
                    /* missing image: the tile stays a dim panel */
                }
            );
        });

        // ---------- red connector lines ----------
        const links: Link[] = [];
        const pulseGeo = new THREE.SphereGeometry(0.07, 10, 10);
        const pulseMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true });
        disposables.push(pulseGeo, pulseMat);

        const spawnLink = () => {
            if (links.length > 5) return;
            const a = tiles[Math.floor(Math.random() * tiles.length)];
            const candidates = tiles
                .filter((t) => t !== a)
                .sort((p, q) => p.position.distanceTo(a.position) - q.position.distanceTo(a.position))
                .slice(0, 6);
            const b = candidates[Math.floor(Math.random() * candidates.length)];
            if (!b) return;

            const mid = a.position.clone().add(b.position).multiplyScalar(0.5);
            mid.setLength(RADIUS * 1.14);
            const curve = new THREE.QuadraticBezierCurve3(a.position.clone(), mid, b.position.clone());

            const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
            const mat = new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0 });
            const line = new THREE.Line(geo, mat);
            world.add(line);

            const pulse = new THREE.Mesh(pulseGeo, pulseMat.clone());
            world.add(pulse);

            links.push({
                line,
                pulse,
                curve,
                t: 0,
                speed: 0.55 + Math.random() * 0.5,
                life: 0,
                maxLife: 1.6 + Math.random() * 0.9,
            });
        };

        const killLink = (link: Link) => {
            world.remove(link.line, link.pulse);
            link.line.geometry.dispose();
            (link.line.material as THREE.Material).dispose();
            (link.pulse.material as THREE.Material).dispose();
        };

        // ---------- focus ----------
        let focused: THREE.Mesh | null = null;
        let aligning = false;
        const alignTarget = new THREE.Quaternion();
        let targetLift = 0; // cylinder: vertical shift that centres the tile
        let lift = 0;

        // Cylinder only: dragging up/down slides the body vertically so the top
        // and bottom rows are reachable. It used to be locked to one axis, so
        // on a phone two of the five rows could never be brought into view.
        // Panning (not tilting) is the right move for a cylinder — tipping it
        // would break the upright columns.
        const ringYs = positions.map((p) => p.y);
        const PAN_LIMIT = CYL ? (Math.max(...ringYs) - Math.min(...ringYs)) / 2 + TILE : 0;
        let panY = 0;
        let velPan = 0; // world units / second

        /**
         * The focused tile's full-size map.
         *
         * A focused tile fills much of the viewport — around 820px wide on a
         * 1440px desktop, twice that on a retina screen — which is well past
         * what the 512px tile map holds. Only one is ever resident: focusing
         * another tile releases the last, so the detail costs one texture
         * rather than 114.
         */
        let fullTex: THREE.Texture | null = null;
        let fullTile: THREE.Mesh | null = null;

        const releaseFull = () => {
            if (fullTile) {
                const mat = fullTile.material as THREE.MeshBasicMaterial;
                const thumb = fullTile.userData.thumbTex as THREE.Texture | undefined;
                if (thumb) {
                    mat.map = thumb;
                    mat.needsUpdate = true;
                }
            }
            fullTex?.dispose();
            fullTex = null;
            fullTile = null;
        };

        const loadFull = (tile: THREE.Mesh) => {
            if (fullTile === tile) return;
            releaseFull();
            fullTile = tile;
            loader.load(
                `/Gallery/full/img${tile.userData.photoIndex}.webp`,
                (tex) => {
                    // focus moved on while this was in flight
                    if (fullTile !== tile) {
                        tex.dispose();
                        return;
                    }
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = maxAniso;
                    fullTex = tex;
                    const mat = tile.material as THREE.MeshBasicMaterial;
                    mat.map = tex;
                    mat.needsUpdate = true;
                },
                undefined,
                () => {
                    /* no full-size file: the tile keeps the map it has */
                }
            );
        };

        const focusTile = (tile: THREE.Mesh) => {
            focused = tile;
            aligning = true;
            loadFull(tile);

            if (CYL) {
                // one axis of freedom: swing the tile round to the front, and
                // slide the body so the tile lands on the camera eye line
                const p = tile.position;
                const theta = Math.atan2(p.x, p.z); // angle from +Z
                alignTarget.setFromAxisAngle(UP, -theta);
                targetLift = -p.y;
            } else {
                const dir = tile.position.clone().normalize();
                alignTarget.setFromUnitVectors(dir, FRONT);

                // setFromUnitVectors squares the tile to the camera but leaves
                // an arbitrary ROLL, which is what used to be corrected by
                // spinning the tile itself — two rotations at once, and the
                // photo tumbled. Roll the BODY instead: work out which way the
                // tile's own up will be pointing once the alignment lands, and
                // fold the correction into the alignment. The tile then never
                // rotates at all; it only scales and comes forward.
                const upAfter = new THREE.Vector3(0, 1, 0)
                    .applyQuaternion(restQuat(tile.userData.outward as THREE.Vector3))
                    .applyQuaternion(alignTarget);
                const roll = Math.atan2(upAfter.x, upAfter.y);
                alignTarget.premultiply(
                    new THREE.Quaternion().setFromAxisAngle(FRONT, -roll)
                );
                targetLift = 0;
            }
        };

        const clearFocus = () => {
            focused = null;
            releaseFull();
            aligning = false;
            targetLift = 0;
        };

        // ---------- drag: 1:1 with the pointer, momentum on release ----------
        const SENS = CYL ? 0.0062 : 0.005; // radians per pixel
        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        let downX = 0;
        let downY = 0;
        let moved = 0;
        let lastMoveT = 0;
        /**
         * Which way this gesture is going. Without this a diagonal swipe spun
         * the body AND panned it at the same time, so on a phone the cylinder
         * appeared to do something unrelated to the finger. The axis is decided
         * once, after the gesture has travelled far enough to have a direction,
         * and holds for the rest of the drag.
         */
        let axis: null | "x" | "y" = null;
        const AXIS_LOCK_PX = 8;
        let velX = 0; // radians / second
        let velY = 0;

        const canvas = renderer.domElement;
        canvas.style.cursor = "grab";
        canvas.style.touchAction = "none";

        // ---------- wheel zoom ----------
        // multiplies the resting camera distance. preventDefault stops the page
        // scrolling behind the canvas while the pointer is over the globe.
        // 0.45 against CAM_FAR 15 put the nearest camera position at z 6.75,
        // and the shell's radius is 6.4 — you were stopped 0.35 units short of
        // the surface, which is why you could never get inside. This takes it
        // to the middle; the tiles are already DoubleSide so they stay visible
        // from within, and the camera's near plane is 0.1.
        const ZOOM_MIN = 0.03;
        const ZOOM_MAX = 1.9;
        let zoom = 1;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const step = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY; // lines vs pixels
            // doubled from 0.0012 — a wheel notch now covers twice the range
            zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * Math.exp(step * 0.0024)));
        };
        canvas.addEventListener("wheel", onWheel, { passive: false });

        const spinEuler = new THREE.Euler();
        const spinQuat = new THREE.Quaternion();
        const applySpin = (rx: number, ry: number) => {
            spinEuler.set(rx, ry, 0);
            spinQuat.setFromEuler(spinEuler);
            world.quaternion.premultiply(spinQuat);
        };

        function pickTile(e: PointerEvent) {
            const r = canvas.getBoundingClientRect();
            const v = new THREE.Vector2(
                ((e.clientX - r.left) / r.width) * 2 - 1,
                -((e.clientY - r.top) / r.height) * 2 + 1
            );
            raycaster.setFromCamera(v, camera);
            const hit = raycaster.intersectObjects(tiles, false)[0];
            return hit ? (hit.object as THREE.Mesh) : null;
        }

        const onDown = (e: PointerEvent) => {
            dragging = true;
            axis = null;
            lastX = downX = e.clientX;
            lastY = downY = e.clientY;
            moved = 0;
            lastMoveT = performance.now();
            velX = velY = 0; // catching it stops the spin dead, like grabbing a wheel
            canvas.style.cursor = "grabbing";
            aligning = false;
            try {
                canvas.setPointerCapture(e.pointerId);
            } catch {
                /* not capturable */
            }
        };

        const onMove = (e: PointerEvent) => {
            if (!dragging) return;
            const now = performance.now();
            const dt = Math.max(1, now - lastMoveT) / 1000;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const totalX = e.clientX - downX;
            const totalY = e.clientY - downY;
            moved = Math.max(moved, Math.hypot(totalX, totalY));

            // commit to an axis once there is enough travel to read one
            if (axis === null && moved > AXIS_LOCK_PX) {
                axis = Math.abs(totalX) >= Math.abs(totalY) ? "x" : "y";
            }

            // move the body with the finger, right now — this is what reads as
            // grabbing it. Velocity is recorded only for the throw on release.
            // before the axis is known, follow the finger on both; after, only
            // the committed one moves
            const useX = axis !== "y";
            const useY = axis !== "x";

            const ry = useX ? dx * SENS : 0;
            const rx = !CYL && useY ? dy * SENS : 0; // a cylinder must not tip; it pans
            applySpin(rx, ry);

            velY = ry / dt;
            velX = rx / dt;

            if (CYL && useY) {
                // px -> world units at the body's depth, so the rows track the
                // finger exactly rather than at some arbitrary rate
                const visibleH = 2 * camera.position.z * Math.tan((45 / 2) * (Math.PI / 180));
                const dWorld = (dy / height) * visibleH;
                const next = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, panY + dWorld));
                velPan = (next - panY) / dt;
                panY = next;
            }

            lastX = e.clientX;
            lastY = e.clientY;
            lastMoveT = now;
        };

        const onUp = (e: PointerEvent) => {
            if (!dragging) return;
            dragging = false;
            canvas.style.cursor = "grab";
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {
                /* never captured */
            }

            // a press that barely moved is a click, not a throw
            if (moved < 6) {
                velX = velY = 0;
                const hit = pickTile(e);
                if (hit && hit !== focused) focusTile(hit);
                else clearFocus();
                return;
            }
            // finger paused before lifting: release, do not fling
            if (performance.now() - lastMoveT > 90) velX = velY = 0;
        };

        canvas.addEventListener("pointerdown", onDown);
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerup", onUp);
        canvas.addEventListener("pointercancel", onUp);

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") clearFocus();
        };
        window.addEventListener("keydown", onKey);

        // ---------- hover ----------
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let pointerInside = false;
        const onPointerTrack = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect();
            pointer.set(
                ((e.clientX - r.left) / r.width) * 2 - 1,
                -((e.clientY - r.top) / r.height) * 2 + 1
            );
            pointerInside = true;
        };
        const onPointerLeave = () => {
            pointerInside = false;
        };
        canvas.addEventListener("pointermove", onPointerTrack);
        canvas.addEventListener("pointerleave", onPointerLeave);

        let visible = true;
        const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, {
            threshold: 0,
        });
        io.observe(mount);


        // ---------- loop ----------
        const clock = new THREE.Clock();
        const wantQuat = new THREE.Quaternion();
        let spawnTimer = 0;
        let frameId = 0;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (!visible) return;
            const dt = Math.min(clock.getDelta(), 0.05);

            if (aligning) {
                // ease toward the chosen tile; a fresh grab cancels this
                world.quaternion.slerp(alignTarget, 1 - Math.pow(0.0001, dt));
                if (world.quaternion.angleTo(alignTarget) < 0.004) aligning = false;
                velX = velY = 0;
            } else if (!dragging) {
                // momentum, bleeding off exponentially per second
                const damp = Math.pow(0.12, dt);
                velY *= damp;
                velX *= damp;
                if (!focused) {
                    // rad/s. At the old 0.09 a full revolution took 70 seconds,
                    // so the globe looked frozen; this brings it to ~28s, slow
                    // enough to read a frame but clearly alive.
                    const idle = 0.22;
                    velY += (idle - velY) * Math.min(1, dt * 0.6);
                }
                applySpin(velX * dt, velY * dt);
            }

            // dust drifts the other way and a touch slower, so the globe reads
            // as turning inside a space rather than against a flat backdrop
            dust.rotation.y -= dt * 0.035;
            dust.rotation.x += dt * 0.008;

            // cylinder: slide the body so the focused row sits on the eye line
            lift += (targetLift - lift) * Math.min(1, dt * 5);
            if (CYL && !dragging) {
                // the vertical throw bleeds off on the same curve as the spin
                velPan *= Math.pow(0.12, dt);
                panY = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, panY + velPan * dt));
            }
            world.position.y = lift + (focused ? 0 : panY);

            const camTarget = (focused ? CAM_NEAR : CAM_FAR) * zoom;
            camera.position.z += (camTarget - camera.position.z) * Math.min(1, dt * 3.2);

            const hovered = (() => {
                if (!pointerInside) return null;
                raycaster.setFromCamera(pointer, camera);
                const hit = raycaster.intersectObjects(tiles, false)[0];
                return hit ? (hit.object as THREE.Mesh) : null;
            })();

            tiles.forEach((tile) => {
                const mat = tile.material as THREE.MeshBasicMaterial;
                const ready = mat.map ? 1 : 0.18;
                const dimmed = focused && tile !== focused ? 0.3 : 1;
                mat.opacity += (ready * dimmed - mat.opacity) * Math.min(1, dt * 6);

                const target = tile === focused ? 1.85 : tile === hovered ? 1.28 : 1;
                tile.scale.setScalar(tile.scale.x + (target - tile.scale.x) * Math.min(1, dt * 9));

                // No special case for the focused tile any more. The body's
                // alignment already squares it to the camera and now carries
                // the upright roll too, so the photo keeps the orientation it
                // has and simply scales up — no flip, no settle.
                wantQuat.copy(restQuat(tile.userData.outward as THREE.Vector3));
                tile.quaternion.slerp(wantQuat, Math.min(1, dt * 5));
            });
            canvas.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "grab";

            spawnTimer -= dt;
            if (spawnTimer <= 0) {
                spawnLink();
                spawnTimer = 0.5 + Math.random() * 0.8;
            }

            for (let i = links.length - 1; i >= 0; i--) {
                const link = links[i];
                link.life += dt;
                link.t = (link.t + dt * link.speed) % 1;
                const k = link.life / link.maxLife;
                const env = k < 0.25 ? k / 0.25 : k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1;
                const focusFade = focused ? 0.2 : 1;
                (link.line.material as THREE.LineBasicMaterial).opacity = env * 0.55 * focusFade;
                (link.pulse.material as THREE.MeshBasicMaterial).opacity = env * focusFade;
                link.curve.getPoint(link.t, link.pulse.position);
                link.pulse.scale.setScalar(0.8 + Math.sin(link.t * Math.PI) * 0.6);
                if (link.life >= link.maxLife) {
                    killLink(link);
                    links.splice(i, 1);
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            width = mount.clientWidth || window.innerWidth;
            height = mount.clientHeight || window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener("resize", onResize);

        return () => {
            cancelAnimationFrame(frameId);
            io.disconnect();
            window.removeEventListener("resize", onResize);
            window.removeEventListener("keydown", onKey);
            canvas.removeEventListener("wheel", onWheel);
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerup", onUp);
            canvas.removeEventListener("pointercancel", onUp);
            canvas.removeEventListener("pointermove", onPointerTrack);
            canvas.removeEventListener("pointerleave", onPointerLeave);
            links.forEach(killLink);
            releaseFull();
            disposables.forEach((d) => d.dispose());
            renderer.dispose();
            if (canvas.parentNode === mount) mount.removeChild(canvas);
        };
    }, [isPhone]);

    // On its own page the globe IS the page: no header, no padding, full
    // viewport. Embedded elsewhere it keeps the titled section treatment.
    if (fullPage) {
        return (
            <div className="relative h-[100dvh] w-full overflow-hidden bg-[#070406]">
                {/* the page is a WebGL canvas, so it carried no heading at all
                    for search engines or assistive tech */}
                <h1 className="sr-only">Gallery — TEDxTIET in photographs</h1>

                {/* ---- ground ----
                    This was a single weak red radial on flat #000, which left
                    the globe floating in an empty box. Four cheap layers now
                    build a lit room: a warm core behind the sphere, a cool
                    counter-light from the lower left, a faint grid for scale,
                    and a vignette to pull the eye to the middle. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(55% 60% at 50% 46%, rgba(235,0,40,0.26) 0%, rgba(120,0,24,0.10) 38%, rgba(0,0,0,0) 72%)",
                    }}
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(40% 45% at 12% 88%, rgba(60,80,170,0.16) 0%, rgba(0,0,0,0) 70%)",
                    }}
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.045]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                        backgroundSize: "clamp(56px, 6vw, 96px) clamp(56px, 6vw, 96px)",
                        maskImage:
                            "radial-gradient(70% 70% at 50% 50%, #000 0%, transparent 100%)",
                        WebkitMaskImage:
                            "radial-gradient(70% 70% at 50% 50%, #000 0%, transparent 100%)",
                    }}
                />

                <div ref={mountRef} className="h-full w-full select-none" />

                {/* vignette sits ABOVE the canvas so it darkens the tiles at the
                    edges too, which is what makes the globe read as spherical */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(78% 78% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
                    }}
                />
                {/* film grain, to match the reel's language on the home page */}
                <div
                    aria-hidden="true"
                    className="gallery-grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
                />

                {/* ---- HUD ---- */}
                <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-between px-5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/55 md:px-8">
                    <span>TEDxTIET · Patiala</span>
                    <span className="hidden sm:inline">35 frames</span>
                </div>

                <p className="pointer-events-none absolute inset-x-0 bottom-6 px-5 text-center font-mono text-[11px] tracking-[0.3em] uppercase text-white/60">
                    Drag to spin · Scroll to zoom · Tap a frame
                </p>
            </div>
        );
    }

    return (
        <section className="relative w-full bg-black py-20 md:py-24 font-body overflow-hidden">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(50% 55% at 50% 50%, rgba(235,0,40,0.16) 0%, rgba(0,0,0,0) 70%)",
                }}
            />

            <div className="relative mx-auto max-w-[1400px] px-6">
                <header className="mb-6 text-center">
                    <p className="font-mono text-[11px] md:text-xs tracking-[0.35em] uppercase text-tedx-red">
                        The Gallery
                    </p>
                    <h2 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] font-black leading-none text-white text-balance">
                        Moments, Connected
                    </h2>
                    <p className="mx-auto mt-3 max-w-[560px] text-pretty text-sm text-white/65">
                        Drag to spin. Tap a frame to bring it forward — tap it again, or press
                        Esc, to step back.
                    </p>
                </header>

                <div ref={mountRef} className="h-[62vh] min-h-[420px] w-full select-none" />
            </div>
        </section>
    );
}
