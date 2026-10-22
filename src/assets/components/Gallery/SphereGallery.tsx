import { useEffect, useRef } from "react";
import * as THREE from "three";
import useIsPhone from "../../hooks/useIsPhone";

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

const IMAGE_COUNT = 35;
/** every photo gets a twin slot, reserved as a placeholder for new media */
const SLOT_COUNT = IMAGE_COUNT * 2;
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
        const TILE = CYL ? 0.78 : 0.92; // half-width of a photo plane
        const CAM_FAR = CYL ? 11.5 : 15;
        const CAM_NEAR = CYL ? 6.4 : 8.6;

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

        const world = new THREE.Group();
        scene.add(world);

        const disposables: { dispose: () => void }[] = [];
        const positions = CYL
            ? cylinderPoints(SLOT_COUNT, RADIUS, 5, TILE * 1.9)
            : fibonacciSphere(SLOT_COUNT, RADIUS);
        const tiles: THREE.Mesh[] = [];

        // ---------- photo tiles ----------
        const loader = new THREE.TextureLoader();
        const tileGeo = new THREE.PlaneGeometry(TILE * 2, TILE * 1.35);
        const placeholderTex = makePlaceholderTexture();
        disposables.push(tileGeo, placeholderTex);

        /** resting orientation: face pointing radially outward */
        const restQuat = (outward: THREE.Vector3) =>
            new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(new THREE.Vector3(), outward, UP)
            );

        positions.forEach((pos, i) => {
            const isPlaceholder = i % 2 === 1;
            const photoIndex = Math.floor(i / 2) + 1;

            const mat = new THREE.MeshBasicMaterial({
                color: isPlaceholder ? 0xffffff : 0x8a8a8a,
                map: isPlaceholder ? placeholderTex : null,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(tileGeo, mat);
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

            if (isPlaceholder) return;

            loader.load(
                `/Gallery/img${photoIndex}.webp`,
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
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

        const focusTile = (tile: THREE.Mesh) => {
            focused = tile;
            aligning = true;

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
                targetLift = 0;
            }
        };

        const clearFocus = () => {
            focused = null;
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
        let velX = 0; // radians / second
        let velY = 0;

        const canvas = renderer.domElement;
        canvas.style.cursor = "grab";
        canvas.style.touchAction = "none";

        // ---------- wheel zoom ----------
        // multiplies the resting camera distance. preventDefault stops the page
        // scrolling behind the canvas while the pointer is over the globe.
        const ZOOM_MIN = 0.45;
        const ZOOM_MAX = 1.9;
        let zoom = 1;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const step = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY; // lines vs pixels
            zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * Math.exp(step * 0.0012)));
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
            moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));

            // move the body with the finger, right now — this is what reads as
            // grabbing it. Velocity is recorded only for the throw on release.
            const ry = dx * SENS;
            const rx = CYL ? 0 : dy * SENS; // the cylinder spins on one axis only
            applySpin(rx, ry);

            velY = ry / dt;
            velX = rx / dt;

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

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
                if (!focused && !reduced) {
                    const idle = 0.09; // rad/s — keeps it alive when untouched
                    velY += (idle - velY) * Math.min(1, dt * 0.6);
                }
                applySpin(velX * dt, velY * dt);
            }

            // cylinder: slide the body so the focused row sits on the eye line
            lift += (targetLift - lift) * Math.min(1, dt * 5);
            world.position.y = lift;

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

                // The focused tile turns square-on to the camera as it comes
                // forward, so it is read flat rather than at the body's angle.
                // Cancelling the world rotation is exactly "face the viewer".
                if (tile === focused) {
                    wantQuat.copy(world.quaternion).invert();
                } else {
                    wantQuat.copy(restQuat(tile.userData.outward as THREE.Vector3));
                }
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
            disposables.forEach((d) => d.dispose());
            renderer.dispose();
            if (canvas.parentNode === mount) mount.removeChild(canvas);
        };
    }, [isPhone]);

    // On its own page the globe IS the page: no header, no padding, full
    // viewport. Embedded elsewhere it keeps the titled section treatment.
    if (fullPage) {
        return (
            <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(45% 50% at 50% 50%, rgba(235,0,40,0.18) 0%, rgba(0,0,0,0) 70%)",
                    }}
                />
                <div ref={mountRef} className="h-full w-full select-none" />
                <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center font-mono text-[11px] tracking-[0.3em] uppercase text-white/60">
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
