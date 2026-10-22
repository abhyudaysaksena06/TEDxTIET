import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
// bundled so the built page is fully self-contained (no /public fetches)
import fontJson from './helvetiker_bold.typeface.json'

/**
 * StageScene — just the 3D TEDxTIET logo, transparent background.
 * The canvas is `absolute inset-0` instead of `fixed` so it sits inside the
 * pinned experience rather than over the whole document.
 *
 * `idleRef` is a ref (never a prop value) holding "the stage is scrolled away".
 * While it is true the render loop idles instead of drawing two full scenes per
 * frame, handing the whole frame budget to the film reel. It has to be a ref so
 * the reel can flip it on every scroll frame without re-rendering React.
 *
 * `frozenRef` is a ref holding `{ frozen, x, y }`. Once `frozen` is true, cursor
 * tracking and drag-to-rotate both stop affecting the logo and its rotation is
 * pinned to `{ x, y }` every frame — used once the user starts scrolling, so the
 * logo settles into a fixed pose instead of continuing to react to the pointer.
 */
/**
 * `mode` picks which title is built: 'logo' (TEDxTIET) or 'archive'
 * (ARCHIVE OF VOICES). `onSelect` fires on a genuine click — a press and release
 * that didn't travel far enough to count as a drag-to-rotate.
 */
/** @param {{ idleRef?: any, frozenRef?: any, mode?: 'logo'|'archive', onSelect?: () => void }} props */
function StageScene({ idleRef, frozenRef, mode = 'logo', onSelect } = {}) {
  const mountRef = useRef(null)
  // kept in a ref so the effect never closes over a stale handler
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const mount = mountRef.current
    let width = mount.clientWidth
    let height = mount.clientHeight

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 1.6, 13)
    camera.lookAt(0, 1.2, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    // subtle reflections so the glossy glass and metal bezels catch highlights
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const logoScene = new THREE.Scene()
    logoScene.environment = envTex
    logoScene.environmentIntensity = 0.18

    // ---------- lights (background meshes are unlit MeshBasic) ----------
    logoScene.add(new THREE.AmbientLight(0xffffff, 0.05))

    // strong light from high above (source out of frame) — lights letter tops,
    // leaves undersides in shadow for depth
    const topLight = new THREE.DirectionalLight(0xffffff, 2.2)
    topLight.position.set(0, 12, 4)
    topLight.target.position.set(0, 0, 0)
    logoScene.add(topLight, topLight.target)

    // dim front fill so shadowed areas aren't pitch black
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.45)
    keyLight.position.set(-4, 4, 8)
    logoScene.add(keyLight)

    const disposables = []
    let disposed = false

    // ---------- 3D text ----------
    const logoGroup = new THREE.Group()
    logoGroup.position.set(0, 1.15, 2.4) // pivot at logo center
    logoScene.add(logoGroup)
    const font = new FontLoader().parse(fontJson)
    {
      const textOpts = {
        font,
        size: 1.5,
        depth: 0.35,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.015,
        bevelSegments: 2,
      }

      // frosted (matte) glass with a faint glow inside the blocks
      const redMat = new THREE.MeshPhysicalMaterial({
        color: 0xcc1212,
        roughness: 0.45,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.5,
        emissive: 0xff2828,
        emissiveIntensity: 0.22,
      })
      // metallic bevel/side edges
      const redSideMat = new THREE.MeshStandardMaterial({
        color: 0xd8d8d8,
        metalness: 0.9,
        roughness: 0.35,
      })

      const whiteMat = new THREE.MeshPhysicalMaterial({
        color: 0xf2f2f2,
        roughness: 0.62,
        metalness: 0.05,
        clearcoat: 0.25,
        clearcoatRoughness: 0.6,
        emissive: 0xffffff,
        emissiveIntensity: 0.24,
      })
      // darker metal so the bezels read against the bright white glass
      const whiteSideMat = new THREE.MeshStandardMaterial({
        color: 0x8f8f8f,
        metalness: 0.85,
        roughness: 0.45,
      })

      // re-group triangles so only the angled bevel strips are metal:
      // 0 = front/back faces, 1 = flat side walls (glass), 2 = bevel edges (metal)
      const make = (text, opts, mats, edgeColor = 0xc8c8c8) => {
        const geo = new TextGeometry(text, opts)
        geo.computeBoundingBox()
        const normal = geo.getAttribute('normal')
        geo.clearGroups()
        for (let i = 0; i < normal.count; i += 3) {
          const nz = (Math.abs(normal.getZ(i)) + Math.abs(normal.getZ(i + 1)) + Math.abs(normal.getZ(i + 2))) / 3
          const matIndex = nz > 0.98 ? 0 : nz < 0.08 ? 1 : 2
          geo.addGroup(i, 3, matIndex)
        }
        const mesh = new THREE.Mesh(geo, mats)
        // silver outline on the sharp corner edges between the side faces
        const edgeGeo = new THREE.EdgesGeometry(geo, 25)
        const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.85 })
        mesh.add(new THREE.LineSegments(edgeGeo, edgeMat))
        disposables.push(geo, edgeGeo, edgeMat)
        return mesh
      }

      if (mode === 'archive') {
        // "ARCHIVE OF VOICES" — two stacked lines, smaller than the logo so the
        // longer string still sits inside the same screen width
        const lineOpts = { ...textOpts, size: 0.95 }
        const top = make('ARCHIVE OF', lineOpts, [whiteMat, whiteMat, whiteSideMat], 0x606060)
        const bottom = make('VOICES', lineOpts, [redMat, redMat, redSideMat])

        // centre each line on its own bounding box, then stack them
        const place = (mesh, y) => {
          const b = mesh.geometry.boundingBox
          mesh.position.set(
            -(b.max.x + b.min.x) / 2,
            y - (b.max.y + b.min.y) / 2,
            -(b.max.z + b.min.z) / 2
          )
        }
        place(top, 0.72)
        place(bottom, -0.72)

        logoGroup.add(top, bottom)
      } else {
        const ted = make('TED', textOpts, [redMat, redMat, redSideMat])
        const tedW = ted.geometry.boundingBox.max.x - ted.geometry.boundingBox.min.x

        const x = make('x', { ...textOpts, size: 0.7 }, [redMat, redMat, redSideMat])
        const xW = x.geometry.boundingBox.max.x - x.geometry.boundingBox.min.x

        // darker outline so the bezels cast a subtle shadow line against the white
        const tiet = make('TIET', textOpts, [whiteMat, whiteMat, whiteSideMat], 0x606060)
        const tietW = tiet.geometry.boundingBox.max.x - tiet.geometry.boundingBox.min.x

        const gap = 0.12
        const total = tedW + gap + xW + gap + tietW
        // vertical/depth centering from TED's own bounds so the pivot sits at the
        // logo's true center and the row is centered on the carpet's axis
        const tb = ted.geometry.boundingBox
        const baseY = -(tb.max.y + tb.min.y) / 2
        const baseZ = -(tb.max.z + tb.min.z) / 2
        // each mesh is shifted by its own min.x so glyph bearing doesn't skew the row
        let cursor = -total / 2
        ted.position.set(cursor - tb.min.x, baseY, baseZ)
        cursor += tedW + gap
        x.position.set(cursor - x.geometry.boundingBox.min.x, baseY + 0.78, baseZ) // superscript x
        cursor += xW + gap
        tiet.position.set(cursor - tiet.geometry.boundingBox.min.x, baseY, baseZ)

        logoGroup.add(ted, x, tiet)
      }
      disposables.push(redMat, redSideMat, whiteMat, whiteSideMat)
    }

    let dragging = false
    let lastX = 0
    let lastY = 0

    // cursor-follow: the logo leans slightly toward the pointer
    let targetRotX = 0
    let targetRotY = 0
    const onMouseTrack = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      targetRotY = nx * 0.22
      targetRotX = ny * 0.12
    }
    window.addEventListener('pointermove', onMouseTrack)

    let frameId
    const animate = () => {
      // scrolled away behind the film reel: keep the loop alive but draw nothing.
      // The last frame stays on the canvas, and since the stage is dimmed and
      // pushed off to the left by then, the freeze is invisible.
      if (idleRef?.current) {
        frameId = requestAnimationFrame(animate)
        return
      }
      if (frozenRef?.current?.frozen) {
        // scroll has taken over: hold the pinned pose, ignore cursor/drag entirely
        logoGroup.rotation.x = frozenRef.current.x
        logoGroup.rotation.y = frozenRef.current.y
      } else if (!dragging) {
        // when not dragging, ease toward the cursor-follow orientation
        logoGroup.rotation.x += (targetRotX - logoGroup.rotation.x) * 0.04
        logoGroup.rotation.y += (targetRotY - logoGroup.rotation.y) * 0.04
      }
      renderer.render(logoScene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    // ---------- drag to rotate the logo ----------
    // active drag is capped to a 30% offset (of a full turn) on every axis
    const MAX_DRAG_ROTATION = Math.PI * 2 * 0.3
    const canvas = renderer.domElement
    canvas.style.cursor = onSelectRef.current ? 'pointer' : 'grab'

    // a press that neither travels far nor lingers counts as a click, so
    // drag-to-rotate and click-to-select can share the same canvas
    const CLICK_SLOP_PX = 6
    const CLICK_MAX_MS = 500
    let pressX = 0
    let pressY = 0
    let pressAt = 0

    const onPointerDown = (e) => {
      pressX = e.clientX
      pressY = e.clientY
      pressAt = performance.now()
      if (frozenRef?.current?.frozen) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      if (!onSelectRef.current) canvas.style.cursor = 'grabbing'
      // capture can throw for a pointer the browser doesn't consider active
      try { canvas.setPointerCapture(e.pointerId) } catch { /* not capturable */ }
    }
    const onPointerMove = (e) => {
      if (!dragging) return
      logoGroup.rotation.y += (e.clientX - lastX) * 0.000625
      logoGroup.rotation.x += (e.clientY - lastY) * 0.000625
      logoGroup.rotation.x = Math.max(-MAX_DRAG_ROTATION, Math.min(MAX_DRAG_ROTATION, logoGroup.rotation.x))
      logoGroup.rotation.y = Math.max(-MAX_DRAG_ROTATION, Math.min(MAX_DRAG_ROTATION, logoGroup.rotation.y))
      lastX = e.clientX
      lastY = e.clientY
    }
    const onPointerUp = (e) => {
      dragging = false
      canvas.style.cursor = onSelectRef.current ? 'pointer' : 'grab'

      // resolve the click FIRST — releasing capture can throw, and a click must
      // never be swallowed by that
      const travelled = Math.hypot(e.clientX - pressX, e.clientY - pressY)
      const held = performance.now() - pressAt
      if (onSelectRef.current && travelled < CLICK_SLOP_PX && held < CLICK_MAX_MS) {
        onSelectRef.current()
      }

      try { canvas.releasePointerCapture(e.pointerId) } catch { /* never captured */ }
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    const handleResize = () => {
      width = mount.clientWidth
      height = mount.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', onMouseTrack)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      mount.removeChild(renderer.domElement)
      disposables.forEach((d) => d.dispose())
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
    }
    // `mode` rebuilds the scene so the title can swap between TEDxTIET and
    // ARCHIVE OF VOICES; it's a one-off click, so the teardown cost is fine
  }, [idleRef, mode])

  return <div ref={mountRef} className="absolute inset-0" />
}

export default StageScene
