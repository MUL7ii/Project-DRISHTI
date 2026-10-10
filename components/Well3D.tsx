"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { EVENTS, FORMATIONS, PATHS, COAL, LOSS_ZONE, OFFSET_ROWS, PLANNED, type Station } from "@/lib/data";

const S = 100; // 1 scene unit = 100 m
const HZ_HEX: Record<string, string> = { mudloss: "#33b1ff", stuck: "#ff832b", kick: "#ff7eb6", torque: "#f1c21b", cement: "#3ddbd9", fishing: "#a8a8a8" };
const SLAB = 176;

const toV = (s: Station) => new THREE.Vector3(s.x / S, -s.tvd / S, -s.y / S);
const at = (stations: Station[], tvd: number) => {
  let i = stations.findIndex((s) => s.tvd >= tvd);
  if (i <= 0) i = 1;
  const a = stations[i - 1], b = stations[i];
  const f = (tvd - a.tvd) / (b.tvd - a.tvd || 1);
  return new THREE.Vector3((a.x + (b.x - a.x) * f) / S, -tvd / S, -(a.y + (b.y - a.y) * f) / S);
};

function Tube({ stations, color, radius, opacity = 1, delay = 0, emissive = 0, fade = true, onOver, onOut, onClick }: {
  stations: Station[]; color: string; radius: number; opacity?: number; delay?: number; emissive?: number; fade?: boolean;
  onOver?: () => void; onOut?: () => void; onClick?: () => void;
}) {
  const geo = useMemo(() => {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stations.map(toV)), 110, radius, 8, false);
    const pos = g.attributes.position;
    const base = new THREE.Color(color);
    const dim = base.clone().multiplyScalar(0.28);
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const t = fade ? Math.min(1, -pos.getY(i) / 37) : 0;
      const c = base.clone().lerp(dim, t * 0.8);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }, [stations, radius, color, fade]);
  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime + delay;
    const p = Math.min(1, Math.max(0, (clock.elapsedTime - t0.current) / 1.6));
    const e = 1 - Math.pow(1 - p, 3);
    geo.setDrawRange(0, Math.floor((geo.index!.count * e) / 3) * 3);
  });
  return (
    <mesh geometry={geo} onPointerOver={(e) => { e.stopPropagation(); onOver?.(); }} onPointerOut={onOut} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      <meshStandardMaterial vertexColors transparent={opacity < 1} opacity={opacity} emissive={color} emissiveIntensity={emissive} roughness={0.35} metalness={0.4} />
    </mesh>
  );
}

function Bit({ stations, tvd }: { stations: Station[]; tvd: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const pos = at(stations, tvd);
  useFrame(({ clock }) => {
    const k = 1 + 0.35 * Math.sin(clock.elapsedTime * 4);
    ring.current?.scale.set(k * 2.4, k * 2.4, k * 2.4);
    if (ring.current) (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.45 - 0.3 * Math.sin(clock.elapsedTime * 4);
  });
  return (
    <group position={pos}>
      <mesh><sphereGeometry args={[0.55, 24, 24]} /><meshStandardMaterial color="#ffffff" emissive="#3ecfb8" emissiveIntensity={2.4} /></mesh>
      <mesh ref={ring}><sphereGeometry args={[0.55, 24, 24]} /><meshBasicMaterial color="#3ecfb8" transparent opacity={0.4} /></mesh>
      <pointLight color="#3ecfb8" intensity={26} distance={14} />
      <Html distanceFactor={80} position={[1.4, 0.6, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ background: "#0d1512", color: "#58e6cf", border: "1px solid #3ecfb8", padding: "2px 8px", fontSize: 12, whiteSpace: "nowrap", fontFamily: "IBM Plex Mono", borderRadius: 6 }}>BIT {Math.round(tvd).toLocaleString("en")} m</div>
      </Html>
    </group>
  );
}

function Terrain({ dark }: { dark: boolean }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(260, 260, 100, 100);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const h = 0.5 * Math.sin(x * 0.07) * Math.cos(z * 0.06) + 0.25 * Math.sin(x * 0.19 + z * 0.13);
      p.setY(i, h - 0.35);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo}><meshStandardMaterial color={dark ? "#16211d" : "#cfd3c8"} roughness={1} transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geo} position={[0, 0.02, 0]}><meshBasicMaterial color={dark ? "#3ecfb8" : "#0f8a78"} wireframe transparent opacity={dark ? 0.07 : 0.16} /></mesh>
    </group>
  );
}

function Slabs({ dark, show }: { dark: boolean; show: boolean }) {
  const edges = useMemo(() => FORMATIONS.map((f) => new THREE.EdgesGeometry(new THREE.BoxGeometry(SLAB, (f.base - f.top) / S, SLAB))), []);
  if (!show) return null;
  return (
    <>
      {FORMATIONS.map((f, fi) => {
        const h = (f.base - f.top) / S;
        const y = -(f.top + f.base) / 2 / S;
        return (
          <group key={f.id} position={[0, y, 0]}>
            <mesh>
              <boxGeometry args={[SLAB, h, SLAB]} />
              <meshBasicMaterial color={f.color} transparent opacity={dark ? 0.07 : 0.12} depthWrite={false} />
            </mesh>
            <lineSegments geometry={edges[fi]}>
              <lineBasicMaterial color={f.color} transparent opacity={dark ? 0.32 : 0.45} />
            </lineSegments>
            <Html position={[-SLAB / 2, h / 2 - 0.4, SLAB / 2]} style={{ pointerEvents: "none" }}>
              <div style={{ color: dark ? "#b6b2a6" : "#4a4a44", fontSize: 11, fontFamily: "IBM Plex Mono", whiteSpace: "nowrap", transform: "translate(-105%, 0)" }}>{f.name} · {f.top} m</div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function Ruler({ dark }: { dark: boolean }) {
  const x = -SLAB / 2 - 3, z = SLAB / 2 + 3;
  return (
    <group>
      <mesh position={[x, -18.5, z]}><boxGeometry args={[0.12, 37, 0.12]} /><meshBasicMaterial color={dark ? "#6d6f6b" : "#85867e"} /></mesh>
      {Array.from({ length: 8 }, (_, i) => i * 500).map((d) => (
        <group key={d} position={[x, -d / S, z]}>
          <mesh><boxGeometry args={[1.4, 0.1, 0.1]} /><meshBasicMaterial color={dark ? "#a3a29a" : "#55564f"} /></mesh>
          <Html position={[2.6, 0, 0]} style={{ pointerEvents: "none" }}><div style={{ color: dark ? "#a3a29a" : "#55564f", fontSize: 10, fontFamily: "IBM Plex Mono" }}>{d}</div></Html>
        </group>
      ))}
    </group>
  );
}

function Scene({ dark, bitTvd, hoverId, onHover, onSelect, showEvents, showFormations, selectedIds }: Props) {
  const planned = PATHS[PLANNED.id];
  const relColor = (r: number) => new THREE.Color(dark ? "#3a4149" : "#a9a89f").lerp(new THREE.Color(dark ? "#3ecfb8" : "#0f8a78"), 0.15 + r * 0.85).getStyle();
  return (
    <>
      <hemisphereLight args={[dark ? "#9fb7c8" : "#ffffff", dark ? "#0a0f0e" : "#8b8878", dark ? 0.75 : 1]} />
      <directionalLight position={[60, 60, 40]} intensity={dark ? 1.1 : 1.4} />
      <Terrain dark={dark} />
      <Slabs dark={dark} show={showFormations !== false} />
      <Ruler dark={dark} />

      <Tube stations={planned} color="#3ecfb8" radius={0.34} emissive={0.7} fade={false} />
      {[1500, 3150].map((d) => {
        const p = at(planned, d);
        return <mesh key={d} position={p}><torusGeometry args={[0.8, 0.12, 8, 24]} /><meshStandardMaterial color="#ff5b5b" emissive="#ff5b5b" emissiveIntensity={0.6} /></mesh>;
      })}
      {[[COAL, "#ff832b"], [LOSS_ZONE, "#33b1ff"]].map(([z, c], i) => {
        const zz = z as { top: number; base: number };
        const a = at(planned, zz.top), b = at(planned, zz.base);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const dir = b.clone().sub(a);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        return (
          <mesh key={i} position={mid} quaternion={q}>
            <cylinderGeometry args={[1.6, 1.6, dir.length(), 28, 1, true]} />
            <meshBasicMaterial color={c as string} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        );
      })}
      {bitTvd != null && <Bit stations={planned} tvd={bitTvd} />}

      {OFFSET_ROWS.map((w, i) => {
        const on = hoverId === w.id;
        const sel = selectedIds?.includes(w.id);
        return (
          <group key={w.id}>
            <Tube stations={PATHS[w.id]} color={sel ? "#ffffff" : relColor(w.relevance)} radius={on || sel ? 0.26 : 0.15} opacity={hoverId && !on ? 0.3 : 1} delay={0.3 + i * 0.07} emissive={on ? 0.9 : 0.12}
              onOver={() => onHover?.(w.id)} onOut={() => onHover?.(null)} onClick={() => onSelect?.(w.id)} />
            <group position={[w.surf.x / S, 0.1, -w.surf.y / S]}>
              <mesh><cylinderGeometry args={[0.7, 0.85, 0.3, 20]} /><meshStandardMaterial color={relColor(w.relevance)} metalness={0.5} roughness={0.35} /></mesh>
              <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.05, 0.05, 1.6, 6]} /><meshStandardMaterial color="#8b8f8c" /></mesh>
            </group>
            {(on || sel) && (
              <Html position={[w.surf.x / S, 2.6, -w.surf.y / S]} style={{ pointerEvents: "none" }}>
                <div style={{ background: dark ? "#111417" : "#f4f2ec", color: dark ? "#e9e6de" : "#1b1c1a", border: "1px solid #3ecfb8", padding: "3px 8px", fontSize: 12, whiteSpace: "nowrap", fontFamily: "IBM Plex Mono", borderRadius: 6 }}>{w.name} · rel {w.relevance.toFixed(2)}</div>
              </Html>
            )}
          </group>
        );
      })}

      {showEvents && EVENTS.map((e) => {
        const p = at(PATHS[e.wellId], e.tvd);
        const c = HZ_HEX[e.type];
        return (
          <group key={e.id} position={p}>
            <mesh><sphereGeometry args={[0.36, 12, 12]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.1} /></mesh>
            <mesh><sphereGeometry args={[0.72, 12, 12]} /><meshBasicMaterial color={c} transparent opacity={0.18} depthWrite={false} /></mesh>
          </group>
        );
      })}

      <group position={[0, 0.12, 0]}>
        <mesh><cylinderGeometry args={[1.1, 1.3, 0.35, 28]} /><meshStandardMaterial color="#3ecfb8" emissive="#3ecfb8" emissiveIntensity={0.6} metalness={0.5} roughness={0.3} /></mesh>
        <Html position={[0, 2.6, 0]} style={{ pointerEvents: "none" }}>
          <div style={{ background: "#3ecfb8", color: "#04120f", padding: "2px 9px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", borderRadius: 6 }}>DEMO-P1</div>
        </Html>
      </group>
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, -13, 0]} maxPolarAngle={Math.PI * 0.6} minDistance={30} maxDistance={260} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

type Props = {
  dark: boolean; bitTvd?: number; hoverId?: string | null; onHover?: (id: string | null) => void; onSelect?: (id: string) => void;
  showEvents?: boolean; showFormations?: boolean; selectedIds?: string[]; height?: number | string;
};

export default function Well3D(props: Props) {
  const [ready, setReady] = useState(false);
  const bg = props.dark ? "#07090a" : "#e3e0d6";
  return (
    <div style={{ height: props.height ?? "100%", minHeight: 360, position: "relative", background: bg, overflow: "hidden" }}>
      <Canvas camera={{ position: [78, 26, 92], fov: 42 }} dpr={[1, 2]} onCreated={() => setReady(true)}>
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, 220, 480]} />
        <Scene {...props} />
      </Canvas>
      {!ready && <div className="empty" style={{ position: "absolute", inset: 0 }}>Loading 3D scene…</div>}
      <div className="eyebrow" style={{ position: "absolute", left: 12, bottom: 8 }}>drag to orbit · scroll to zoom · 1 unit = 100 m · red rings are casing shoes</div>
    </div>
  );
}
