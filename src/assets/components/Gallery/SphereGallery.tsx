import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * SphereGallery — photographs distributed over a sphere you can spin.
 *
 * Inspired by the media wall on beckyentertainment.co (three.js + inertial
 * drag), retuned for this site: black ground, TEDx red, and a signature of its
 * own — thin red lines that jump between neighbouring photos, each carrying a
 * travelling pulse, so the cloud reads as wired-together rather than static.
 *
 * Two behaviours worth knowing about:
 *  - Tiles are oriented RADIALLY (each one's face points out from the centre),
 *    not billboarded at the camera, so the cloud reads as a solid globe.
 *  - Clicking a tile spins the globe until that tile faces you and pulls the
 *    camera in. Dragging still works throughout — taking hold of it simply
 *    cancels the auto-alignment and hands control back.
 *
 * Rotation is stored as a quaternion rather than Euler angles: aligning an
 * arbitrary tile to the camera is a single slerp that way, whereas with x/y
 * Euler it needs trigonometry that gimbal-locks near the poles.
 */

const IMAGE_COUNT = 35;
/** every photo gets a twin slot, reserved as a placeholder for new media */
const SLOT_COUNT = IMAGE_COUNT * 2;
const RADIUS = 6.4;
const TILE = 0.92; // half-width of a photo plane
const RED = new THREE.Color("#eb0028");

const CAM_FAR = 15; // resting distance
const CAM_NEAR = 8.6; // pulled in on a focused tile
const FRONT = new THREE.Vector3(0, 0, 1); // toward the camera

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

/** Dark panel with a dashed red frame — the "awaiting new media" slot. */
function makePlaceholderTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 346;
    const g = c.getContext("2d")!;

    g.fillStyle = "#0c0c0c";
    g.fillRect(0, 0, c.width, c.height);

    g.strokeStyle = "rgba(235,0,40,0.5)";
    g.lineWidth = 6;
    g.setLineDash([20, 16]);
    g.strokeRect(12, 12, c.width - 24, c.height - 24);

    const cx = c.width / 2;
    const cy = c.height / 2 - 16;
    g.setLineDash([]);
    g.strokeStyle = "rgba(235,0,40,0.85)";
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(cx - 30, cy);
    g.lineTo(cx + 30, cy);
    g.moveTo(cx, cy - 30);
    g.lineTo(cx, cy + 30);
    g.stroke();

    g.fillStyle = "rgba(255,255,255,0.55)";
    g.font = "bold 28px ui-monospace, monospace";
    g.textAlign = "center";
    g.fillText("NEW MEDIA", cx, cy + 76);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

interface Link {
    line: THREE.Line;
    pulse: THREE.Mesh;
    curve: THREE.QuadraticBezierCurve3;
    /** 0..1 progress of the travelling pulse */
    t: number;
    speed: number;
    life: number;
    maxLife: number;
}

export default function SphereGallery() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let width = mount.clientWidth || window.innerWidth;
        let height = mount.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, CAM_FAR);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // the whole cloud lives on one group so drag rotates everything together
        const world = new THREE.Group();
        scene.add(world);

        const disposables: { dispose: () => void }[] = [];
        const positions = fibonacciSphere(SLOT_COUNT, RADIUS);
        const tiles: THREE.Mesh[] = [];

        // ---------- photo tiles ----------
        const loader = new THREE.TextureLoader();
        const tileGeo = new THREE.PlaneGeometry(TILE * 2, TILE * 1.35);
        const placeholderTex = makePlaceholderTexture();
        disposables.push(tileGeo, placeholderTex);

        positions.forEach((pos, i) => {
            // alternate real photo / placeholder so the empty slots spread evenly
            const isPlaceholder = i % 2 === 1;
            const photoIndex = Math.floor(i / 2) + 1;

            const mat = new THREE.MeshBasicMaterial({
                color: isPlaceholder ? 0xffffff : 0x8a8a8a, // dim until its texture lands
                map: isPlaceholder ? placeholderTex : null,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(tileGeo, mat);
            mesh.position.copy(pos);
            // face radially outward: point the plane's +Z along its own position
            mesh.lookAt(pos.clone().multiplyScalar(2));
            mesh.userData.isPlaceholder = isPlaceholder;
            mesh.userData.photoIndex = photoIndex;
            world.add(mesh);
            tiles.push(mesh);
            disposables.push(mat);

            if (isPlaceholder) return;

            loader.load(
                `/Gallery/img${photoIndex}.jpeg`,
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    mat.map = tex;
                    mat.color.set(0xffffff);
                    mat.needsUpdate = true;
                    disposables.push(tex);
                },
                undefined,
                () => {
                    /* missing image: the tile just stays a dim panel */
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
            // prefer a nearby partner so lines stay short and legible
            const candidates = tiles
                .filter((t) => t !== a)
                .sort((p, q) => p.position.distanceTo(a.position) - q.position.distanceTo(a.position))
                .slice(0, 6);
            const b = candidates[Math.floor(Math.random() * candidates.length)];
            if (!b) return;

            // bow the line outward so it arcs over the sphere's surface
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

        // ---------- focus state ----------
        let focused: THREE.Mesh | null = null;
        /** true while the globe is auto-turning; any drag cancels it */
        let aligning = false;
        const alignTarget = new THREE.Quaternion();

        const focusTile = (tile: THREE.Mesh) => {
            focused = tile;
            aligning = true;
            // rotation that carries this tile's direction round to face the camera
            const dir = tile.position.clone().normalize();
            alignTarget.setFromUnitVectors(dir, FRONT);
        };
        const clearFocus = () => {
            focused = null;
            aligning = false;
        };

        // ---------- inertial drag ----------
        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        let velX = 0;
        let velY = 0;
        // click vs drag: a press that barely moves is a click
        let downX = 0;
        let downY = 0;
        let moved = 0;
        const canvas = renderer.domElement;
        canvas.style.cursor = "grab";
        canvas.style.touchAction = "none";

        const onDown = (e: PointerEvent) => {
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            downX = e.clientX;
            downY = e.clientY;
            moved = 0;
            canvas.style.cursor = "grabbing";
            // taking hold of the globe cancels the auto-turn, but keeps the zoom
            aligning = false;
            try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
        };
        const onMove = (e: PointerEvent) => {
            if (!dragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
            // feed velocity rather than setting rotation, so releasing keeps the spin
            velY += dx * 0.00035;
            velX += dy * 0.00028;
            lastX = e.clientX;
            lastY = e.clientY;
        };
        const onUp = (e: PointerEvent) => {
            dragging = false;
            canvas.style.cursor = "grab";
            try { canvas.releasePointerCapture(e.pointerId); } catch { /* never captured */ }

            if (moved < 5) {
                // a click: focus what's under it, or step back out
                const hit = pickTile(e);
                if (hit && hit !== focused) focusTile(hit);
                else clearFocus();
            }
        };
        canvas.addEventListener("pointerdown", onDown);
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerup", onUp);
        canvas.addEventListener("pointercancel", onUp);

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") clearFocus();
        };
        window.addEventListener("keydown", onKey);

        // ---------- hover highlight ----------
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        // an off-canvas NDC still casts a valid ray and can clip a tile, so track
        // presence explicitly rather than parking the pointer at a sentinel value
        let pointerInside = false;
        const onPointerTrack = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect();
            pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            pointerInside = true;
        };
        const onPointerLeave = () => { pointerInside = false; };
        canvas.addEventListener("pointermove", onPointerTrack);
        canvas.addEventListener("pointerleave", onPointerLeave);

        /** nearest tile under a pointer event, or null */
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

        // pause the loop entirely while the section is off-screen
        let visible = true;
        const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, {
            threshold: 0,
        });
        io.observe(mount);

        // ---------- loop ----------
        const clock = new THREE.Clock();
        const spinEuler = new THREE.Euler();
        const spinQuat = new THREE.Quaternion();
        let spawnTimer = 0;
        let frameId = 0;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (!visible) return;

            const dt = Math.min(clock.getDelta(), 0.05);

            if (!dragging) {
                if (focused) {
                    // hold still on the focused frame instead of drifting off it
                    velY *= 0.88;
                    velX *= 0.88;
                } else {
                    // idle drift keeps it alive when nobody's touching it
                    velY += (0.0016 - velY) * 0.012;
                    velX *= 0.94;
                }
            }

            if (aligning) {
                world.quaternion.slerp(alignTarget, 0.09);
                if (world.quaternion.angleTo(alignTarget) < 0.005) aligning = false;
                velX = 0;
                velY = 0;
            } else {
                // screen-space drag: premultiply so it turns about the view axes
                spinEuler.set(velX, velY, 0);
                spinQuat.setFromEuler(spinEuler);
                world.quaternion.premultiply(spinQuat);
                if (!dragging) velY *= 0.965;
            }

            // pull the camera in while a frame is selected
            const camTarget = focused ? CAM_NEAR : CAM_FAR;
            camera.position.z += (camTarget - camera.position.z) * 0.06;

            const hovered = (() => {
                if (!pointerInside) return null;
                raycaster.setFromCamera(pointer, camera);
                const hit = raycaster.intersectObjects(tiles, false)[0];
                return hit ? (hit.object as THREE.Mesh) : null;
            })();

            tiles.forEach((tile) => {
                const mat = tile.material as THREE.MeshBasicMaterial;

                // ready state, then dimmed if another tile holds focus
                const ready = mat.map ? 1 : 0.18;
                const dimmed = focused && tile !== focused ? 0.34 : 1;
                mat.opacity += (ready * dimmed - mat.opacity) * 0.08;

                const target = tile === focused ? 1.75 : tile === hovered ? 1.28 : 1;
                const s = tile.scale.x + (target - tile.scale.x) * 0.14;
                tile.scale.setScalar(s);
            });
            canvas.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "grab";

            // connector lines: fade in, run the pulse along, fade out, recycle
            spawnTimer -= dt;
            if (spawnTimer <= 0) {
                spawnLink();
                spawnTimer = 0.5 + Math.random() * 0.8;
            }

            for (let i = links.length - 1; i >= 0; i--) {
                const link = links[i];
                link.life += dt;
                link.t = (link.t + dt * link.speed) % 1;

                // triangular envelope: up, hold, down
                const k = link.life / link.maxLife;
                const env = k < 0.25 ? k / 0.25 : k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1;
                // lines recede while a frame is being read
                const focusFade = focused ? 0.25 : 1;
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
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerup", onUp);
            canvas.removeEventListener("pointercancel", onUp);
            canvas.removeEventListener("pointermove", onPointerTrack);
            canvas.removeEventListener("pointerleave", onPointerLeave);
            links.forEach(killLink);
            disposables.forEach((d) => d.dispose());
            renderer.dispose();
            if (canvas.parentNode === mount) mount.removeChild(canvas);
        };
    }, []);

    return (
        <section className="relative w-full bg-black py-20 md:py-24 font-body overflow-hidden">
            {/* faint red bloom behind the cloud so it sits in light, not a void */}
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
                    <p className="font-mono text-[10px] md:text-xs tracking-[0.35em] uppercase text-tedx-red">
                        The Gallery
                    </p>
                    <h2 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] font-black leading-none text-white">
                        Moments, Connected
                    </h2>
                    <p className="mx-auto mt-3 max-w-[560px] text-sm text-white/55">
                        Drag to spin the sphere. Click a frame to bring it forward — click it
                        again, or press Esc, to step back out.
                    </p>
                </header>

                <div
                    ref={mountRef}
                    className="h-[62vh] min-h-[420px] w-full select-none"
                />
            </div>
        </section>
    );
}
