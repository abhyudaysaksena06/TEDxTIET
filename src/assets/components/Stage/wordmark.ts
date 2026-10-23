import * as THREE from "three";
import { FontLoader, type Font, type FontData } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontJson from "./helvetiker_bold.typeface.json";

/**
 * The TEDxTIET wordmark as geometry, for scenes other than the hero.
 *
 * Same face, extrusion, bevel and layout as buildWordmark in StageScene.jsx,
 * so a copy elsewhere is the same mark rather than a lookalike. StageScene
 * keeps its own copy because it also builds the "Archive of Voices" title and
 * crossfades between the two; if the hero's lettering changes, change it here
 * too.
 */

export const WORDMARK_TEXT = {
    size: 1.5,
    depth: 0.35,
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 2,
};

let font: Font | null = null;
const wordmarkFont = () => (font ??= new FontLoader().parse(fontJson as unknown as FontData));

export interface WordmarkPart {
    geometry: THREE.BufferGeometry;
    /** TED and the x are red, TIET is white */
    tone: "red" | "white";
    position: THREE.Vector3;
}

/**
 * Split a text geometry into material groups: 0 for the front and back
 * faces, 1 for the side walls and bevels. The extrusion only reads as 3D if
 * the walls are a different tone from the faces.
 */
function groupFacesAndSides(geo: THREE.BufferGeometry) {
    const normal = geo.getAttribute("normal");
    geo.clearGroups();
    for (let i = 0; i < normal.count; i += 3) {
        const nz =
            (Math.abs(normal.getZ(i)) + Math.abs(normal.getZ(i + 1)) + Math.abs(normal.getZ(i + 2))) / 3;
        geo.addGroup(i, 3, nz > 0.98 ? 0 : 1);
    }
}

/** TED, a superscript x and TIET, centred on the origin. */
export function layoutWordmark(): { parts: WordmarkPart[]; width: number; height: number } {
    const f = wordmarkFont();
    const make = (text: string, size: number) => {
        const geo = new TextGeometry(text, { ...WORDMARK_TEXT, font: f, size });
        geo.computeBoundingBox();
        groupFacesAndSides(geo);
        return geo;
    };
    const w = (g: THREE.BufferGeometry) => g.boundingBox!.max.x - g.boundingBox!.min.x;

    const ted = make("TED", WORDMARK_TEXT.size);
    const x = make("x", 0.7);
    const tiet = make("TIET", WORDMARK_TEXT.size);

    const gap = 0.12;
    const total = w(ted) + gap + w(x) + gap + w(tiet);
    const tb = ted.boundingBox!;
    const baseY = -(tb.max.y + tb.min.y) / 2;
    const baseZ = -(tb.max.z + tb.min.z) / 2;

    let cursor = -total / 2;
    const parts: WordmarkPart[] = [];
    parts.push({ geometry: ted, tone: "red", position: new THREE.Vector3(cursor - tb.min.x, baseY, baseZ) });
    cursor += w(ted) + gap;
    parts.push({
        geometry: x,
        tone: "red",
        position: new THREE.Vector3(cursor - x.boundingBox!.min.x, baseY + 0.78, baseZ),
    });
    cursor += w(x) + gap;
    parts.push({
        geometry: tiet,
        tone: "white",
        position: new THREE.Vector3(cursor - tiet.boundingBox!.min.x, baseY, baseZ),
    });

    return { parts, width: total, height: tb.max.y - tb.min.y };
}
