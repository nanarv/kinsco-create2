import { useState, useId } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ShapeId = "circle" | "square" | "heart" | "star" | "blob"
type BaseId = "plain" | "choc" | "sugar"
type MixinId = "chip" | "sprinkle" | "nut"
type ToppingId = "swirl" | "drizzle" | "dust"

interface MixinSlot { id: MixinId; color: string; name?: string }

interface CookieSpec {
  shape: ShapeId
  base: { id: BaseId; color: string; name?: string }
  mixins: MixinSlot[]
  topping: { id: ToppingId; color: string; name?: string } | null
}

// ─── Shape paths (300×300 viewBox) ────────────────────────────────────────────

const SHAPES: Record<ShapeId, { path: string; label: string }> = {
  circle: {
    label: "Round",
    path: "M150,10 A140,140 0 1,1 149.99,10 Z",
  },
  square: {
    label: "Square",
    path: "M45,10 H255 Q290,10 290,45 V255 Q290,290 255,290 H45 Q10,290 10,255 V45 Q10,10 45,10 Z",
  },
  heart: {
    label: "Heart",
    path: "M150,268 C148,264 25,182 22,105 C18,52 62,22 102,42 C120,51 138,66 150,86 C162,66 180,51 198,42 C238,22 282,52 278,105 C275,182 152,264 150,268 Z",
  },
  star: {
    label: "Star",
    path: "M150,12 L184,107 L284,109 L205,169 L232,265 L150,208 L68,265 L95,169 L16,109 L116,107 Z",
  },
  blob: {
    label: "Blob",
    path: "M170,20 C225,8 290,68 288,125 C286,188 248,244 198,266 C162,282 120,280 80,260 C30,232 8,175 14,118 C20,55 88,10 150,20 Z",
  },
}

// ─── Grayscale base textures (300×300) ────────────────────────────────────────
// These are drawn in grayscale. At render time a solid color rect + mix-blend-mode:
// multiply tints them — one drawing, any color (ADR 0001).

function PlainTexture() {
  return (
    <>
      <rect width="300" height="300" fill="#e0e0e0" />
      {/* Subtle bumps baked into the texture */}
      {[
        [42, 38], [118, 28], [198, 40], [258, 55],
        [25, 100], [80, 88], [152, 80], [228, 92], [278, 85],
        [48, 148], [108, 138], [175, 130], [238, 145], [268, 158],
        [30, 200], [92, 190], [158, 198], [222, 188], [270, 202],
        [55, 252], [130, 245], [200, 252], [258, 248],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx} cy={cy}
          r={6 + (i % 4) * 2}
          fill={i % 3 === 0 ? "#c8c8c8" : "#d4d4d4"}
          opacity={0.55 + (i % 3) * 0.1}
        />
      ))}
    </>
  )
}

function ChocTexture() {
  return (
    <>
      <rect width="300" height="300" fill="#b0b0b0" />
      <path
        d="M25,35 Q155,5 278,65 Q318,145 228,208 Q148,272 55,245 Q-15,195 25,35Z"
        fill="#888" opacity="0.38"
      />
      <path
        d="M65,82 Q178,55 252,128 Q288,185 212,232 Q138,270 78,238 Q22,200 65,82Z"
        fill="#d0d0d0" opacity="0.22"
      />
      <path
        d="M105,115 Q188,92 238,155 Q262,202 198,228 Q132,252 100,215 Q68,178 105,115Z"
        fill="#999" opacity="0.28"
      />
    </>
  )
}

function SugarTexture() {
  const pts: [number, number, number][] = [
    [52,38,7],[110,25,4],[178,36,6],[242,48,5],[278,38,7],
    [28,92,5],[82,80,8],[148,72,4],[218,85,7],[268,78,5],
    [42,140,8],[105,128,5],[168,122,7],[232,135,5],[272,148,6],
    [35,188,5],[98,178,7],[162,182,5],[228,175,8],[265,190,5],
    [55,235,7],[118,228,4],[182,235,6],[240,228,5],[272,240,7],
  ]
  return (
    <>
      <rect width="300" height="300" fill="#ebebeb" />
      {pts.map(([cx, cy, r], i) => (
        <g key={i} transform={`translate(${cx},${cy})`}>
          <circle r={r} fill={i % 5 === 0 ? "#fff" : "#ccc"} opacity={0.8 + (i % 3) * 0.05} />
          {i % 5 === 0 && (
            <>
              <line x1={0} y1={-r - 3} x2={0} y2={r + 3} stroke="#ddd" strokeWidth={1} />
              <line x1={-r - 3} y1={0} x2={r + 3} y2={0} stroke="#ddd" strokeWidth={1} />
            </>
          )}
        </g>
      ))}
    </>
  )
}

const BASE_TEXTURES: Record<BaseId, React.ComponentType> = {
  plain: PlainTexture,
  choc: ChocTexture,
  sugar: SugarTexture,
}

// ─── Mixin icons (48×48, currentColor) ────────────────────────────────────────
// Inline SVG drawn once; color prop swapped at runtime — mirrors ADR 0001 intent.
// When real grayscale PNG assets ship, these become: grayscale img + multiply overlay.

function ChipMixin({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" overflow="visible">
      <path
        d="M24,6 C19,11 10,20 10,31 C10,40 16,46 24,46 C32,46 38,40 38,31 C38,20 29,11 24,6Z"
        fill={color}
      />
      <path
        d="M14,36 C12,42 16,46 24,46 C32,46 36,42 34,36Z"
        fill="rgba(0,0,0,0.22)"
      />
      <ellipse cx="19" cy="21" rx="4" ry="6" fill="rgba(255,255,255,0.42)" />
    </svg>
  )
}

function SprinkleMixin({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" overflow="visible">
      <g transform="rotate(32, 24, 24)">
        <rect x="16" y="7" width="16" height="34" rx="8" fill={color} />
        <rect x="18" y="9" width="10" height="13" rx="5" fill="rgba(255,255,255,0.35)" />
        <rect x="18" y="30" width="10" height="9" rx="4" fill="rgba(0,0,0,0.2)" />
      </g>
    </svg>
  )
}

function NutMixin({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" overflow="visible">
      <ellipse cx="24" cy="26" rx="17" ry="20" fill={color} />
      {[18, 25, 32].map((y, i) => (
        <path
          key={i}
          d={`M10,${y} Q24,${y - 4} 38,${y}`}
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
      <ellipse cx="18" cy="19" rx="5" ry="7" fill="rgba(255,255,255,0.38)" />
      <ellipse cx="30" cy="36" rx="9" ry="6" fill="rgba(0,0,0,0.18)" />
    </svg>
  )
}

const MIXIN_COMPONENTS: Record<MixinId, React.ComponentType<{ color: string }>> = {
  chip: ChipMixin,
  sprinkle: SprinkleMixin,
  nut: NutMixin,
}

// Two alternating scatter patterns so layer N+1 fills the gaps left by layer N.
// Each entry: top-left (x,y) of a 48×48 icon, r = rotation in degrees.
// Positions are within the 300×300 cookie circle (center 150,150, r≈130).
const SCATTER_A = [
  { x: 56,  y: 72,  r: 12  }, { x: 130, y: 48,  r: -8  }, { x: 200, y: 64,  r: 20  },
  { x: 240, y: 126, r: -15 }, { x: 226, y: 196, r: 8   },
  { x: 158, y: 220, r: -22 }, { x: 80,  y: 212, r: 18  },
  { x: 36,  y: 148, r: -5  }, { x: 102, y: 126, r: 30  }, { x: 178, y: 142, r: -18 },
  { x: 126, y: 170, r: 10  },
]
const SCATTER_B = [
  { x: 96,  y: 60,  r: -18 }, { x: 166, y: 74,  r: 15  }, { x: 222, y: 108, r: -8  },
  { x: 238, y: 168, r: 25  }, { x: 198, y: 228, r: -12 },
  { x: 116, y: 238, r: 20  }, { x: 52,  y: 184, r: -28 },
  { x: 44,  y: 108, r: 8   }, { x: 150, y: 102, r: -20 }, { x: 210, y: 172, r: 15  },
  { x: 74,  y: 152, r: -10 },
]
const SCATTER_PATTERNS = [SCATTER_A, SCATTER_B]

// ─── Topping icons (full 300×300 canvas) ──────────────────────────────────────

function SwirlTopping({ color }: { color: string }) {
  return (
    <g transform="translate(50,48)">
      <path
        d="M100,102 C100,68 73,52 57,66 C42,80 53,107 74,110 C93,112 104,94 100,78 C96,63 80,61 72,70"
        fill="none" stroke={color} strokeWidth="24" strokeLinecap="round"
      />
      <path
        d="M100,102 C100,68 73,52 57,66 C42,80 53,107 74,110 C93,112 104,94 100,78 C96,63 80,61 72,70"
        fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="24" strokeLinecap="round"
        strokeDasharray="10 12"
      />
      <path
        d="M100,102 C100,68 73,52 57,66 C42,80 53,107 74,110 C93,112 104,94 100,78 C96,63 80,61 72,70"
        fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="9" strokeLinecap="round"
      />
      <path
        d="M100,102 C122,90 142,96 142,118 C142,135 124,142 114,133"
        fill="none" stroke={color} strokeWidth="20" strokeLinecap="round"
      />
      <path
        d="M100,102 C100,125 88,142 66,138"
        fill="none" stroke={color} strokeWidth="18" strokeLinecap="round"
      />
      <circle cx="100" cy="102" r="15" fill={color} />
      <circle cx="95" cy="96" r="5" fill="rgba(255,255,255,0.38)" />
    </g>
  )
}

function DrizzleTopping({ color }: { color: string }) {
  const lines: [number, number, number, number, number, number][] = [
    [25, 68, 88, 48, 152, 68, 9],
    [22, 102, 86, 80, 150, 102, 7],
    [28, 138, 92, 116, 154, 138, 9],
    [24, 172, 88, 152, 152, 172, 6],
    [30, 208, 94, 188, 156, 208, 8],
  ]
  const drips: [number, number, number, number][] = [
    [88, 68, 85, 96], [152, 102, 149, 132], [92, 138, 89, 162],
  ]
  return (
    <g>
      {lines.map(([x1, y1, cx, cy, x2, y2, w], i) => (
        <path
          key={i}
          d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
          fill="none" stroke={color} strokeWidth={w} strokeLinecap="round"
        />
      ))}
      {drips.map(([x1, y1, x2, y2], i) => (
        <path
          key={i}
          d={`M${x1},${y1} Q${x1 - 2},${(y1 + y2) / 2} ${x2},${y2}`}
          fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
        />
      ))}
    </g>
  )
}

function DustTopping({ color }: { color: string }) {
  const dots: [number, number, number][] = [
    [52,52,7],[100,42,5],[158,52,8],[212,48,6],[255,62,5],
    [38,98,6],[86,88,9],[142,82,5],[198,94,7],[250,98,6],
    [58,138,5],[112,128,7],[168,122,9],[222,136,5],[264,142,7],
    [42,178,8],[102,170,5],[160,176,6],[218,172,8],[260,182,5],
    [68,218,5],[126,212,8],[176,218,6],[228,212,7],[256,225,5],
  ]
  return (
    <g>
      {dots.map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill={color}
          opacity={0.45 + (i % 5) * 0.11}
        />
      ))}
    </g>
  )
}

const TOPPING_COMPONENTS: Record<ToppingId, React.ComponentType<{ color: string }>> = {
  swirl: SwirlTopping,
  drizzle: DrizzleTopping,
  dust: DustTopping,
}

// ─── CookieCanvas ─────────────────────────────────────────────────────────────
// Accepts a CookieSpec and renders it as layered SVG.
// This is the component re-used in the gallery — same struct, no image snapshot.

interface CookieCanvasProps {
  spec: CookieSpec
  size?: number
}

const FALLBACK_SPEC: CookieSpec = {
  shape: "circle",
  base: { id: "plain", color: "#daa15a" },
  mixins: [],
  topping: null,
}

function CookieCanvas({ spec = FALLBACK_SPEC, size = 300 }: CookieCanvasProps) {
  const uid = useId().replace(/:/g, "")
  const clipId = `clip-${uid}`
  const vignetteId = `vignette-${uid}`
  const shadowId = `shadow-${uid}`
  const safeSpec = spec ?? FALLBACK_SPEC
  const shapePath = (SHAPES[safeSpec.shape] ?? SHAPES.circle).path
  const BaseTexture = BASE_TEXTURES[safeSpec.base?.id ?? "plain"] ?? PlainTexture

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      style={{ display: "block", overflow: "visible" }}
      aria-label="Cookie preview"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={shapePath} />
        </clipPath>
        <radialGradient id={vignetteId} cx="50%" cy="50%" r="50%">
          <stop offset="68%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
        </radialGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="145%" height="145%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(110,29,24,0.28)" />
        </filter>
      </defs>

      {/* Ambient shadow behind the cookie shape */}
      <path d={shapePath} fill="rgba(110,29,24,0.12)" transform="translate(2,10)" />

      <g clipPath={`url(#${clipId})`}>

        {/* ── Base layer: solid color + grayscale texture via multiply (ADR 0001) */}
        <g style={{ isolation: "isolate" }}>
          <rect width="300" height="300" fill={safeSpec.base?.color ?? "#daa15a"} />
          {/* Grayscale texture drawn once; multiply preserves shadow/highlight detail
              while the solid color underneath supplies the chosen tint */}
          <g style={{ mixBlendMode: "multiply" }}>
            <BaseTexture />
          </g>
        </g>

        {/* ── Mixin layers — each slot scatters its icon across the whole cookie.
              Alternating scatter patterns mean layer N+1 peeks through layer N. */}
        {(safeSpec.mixins ?? []).map((m, i) => {
          const Comp = MIXIN_COMPONENTS[m.id] ?? ChipMixin
          const pattern = SCATTER_PATTERNS[i % SCATTER_PATTERNS.length]
          return (
            <g key={i}>
              {pattern.map((pt, j) => (
                <g key={j} transform={`translate(${pt.x},${pt.y}) rotate(${pt.r},24,24)`}>
                  <Comp color={m.color} />
                </g>
              ))}
            </g>
          )
        })}

        {/* ── Topping layer */}
        {safeSpec.topping && (() => {
          const Comp = TOPPING_COMPONENTS[safeSpec.topping!.id] ?? SwirlTopping
          return <Comp color={safeSpec.topping!.color} />
        })()}

        {/* ── Edge vignette (baked-in depth cue) */}
        <rect width="300" height="300" fill={`url(#${vignetteId})`} style={{ pointerEvents: "none" }} />

      </g>

      {/* Subtle rim highlight */}
      <path
        d={shapePath}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="3"
        style={{ pointerEvents: "none" }}
      />
    </svg>
  )
}

// ─── Options metadata ──────────────────────────────────────────────────────────

const BASE_OPTIONS: { id: BaseId; label: string; emoji: string }[] = [
  { id: "plain", label: "Classic", emoji: "🍪" },
  { id: "choc", label: "Chocolate", emoji: "🍫" },
  { id: "sugar", label: "Sugar", emoji: "✨" },
]

const MIXIN_OPTIONS: { id: MixinId; label: string }[] = [
  { id: "chip", label: "Choc Chip" },
  { id: "sprinkle", label: "Sprinkle" },
  { id: "nut", label: "Walnut" },
]

const TOPPING_OPTIONS: { id: ToppingId; label: string; emoji: string }[] = [
  { id: "swirl", label: "Frosting", emoji: "🌀" },
  { id: "drizzle", label: "Drizzle", emoji: "〰️" },
  { id: "dust", label: "Sugar Dust", emoji: "✨" },
]

const DEFAULT_SPEC: CookieSpec = {
  shape: "circle",
  base: { id: "plain", color: "#daa15a" },
  mixins: [{ id: "chip", color: "#3a2620" }],
  topping: null,
}

// ─── ColorSwatch — styled color picker ────────────────────────────────────────

function ColorSwatch({
  color, onChange, label,
}: { color: string; onChange: (c: string) => void; label: string }) {
  return (
    <label className="cursor-pointer relative flex-shrink-0" title={label}>
      <span
        className="block w-8 h-8 rounded-full"
        style={{
          background: color,
          border: "2px solid rgba(174,38,46,0.3)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.14)",
        }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        aria-label={label}
      />
    </label>
  )
}

// ─── Chip button ──────────────────────────────────────────────────────────────

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      style={{
        background: active ? "#daa15a" : "#f5efeb",
        border: active ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.22)",
        color: active ? "#3a2620" : "#a7a19e",
        boxShadow: active ? "0 2px 8px rgba(174,38,46,0.2)" : "none",
      }}
    >
      {children}
    </button>
  )
}

// ─── NameInput — custom ingredient label ──────────────────────────────────────

function NameInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs font-bold" style={{ color: "#a7a19e" }}>Custom name</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold outline-none transition-all"
        style={{
          background: "#f5efeb",
          border: "1.5px solid rgba(174,38,46,0.18)",
          color: "#3a2620",
          maxWidth: 180,
        }}
      />
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs font-extrabold uppercase tracking-widest"
      style={{ color: "#a7a19e", letterSpacing: "0.1em" }}
    >
      {children}
    </span>
  )
}

// ─── Build steps ─────────────────────────────────────────────────────────────

const STEP_LABELS = ["Shape", "Dough", "Mix-ins", "Topping", "Publish"] as const
type StepIndex = 0 | 1 | 2 | 3 | 4
const TOTAL_STEPS = STEP_LABELS.length

// ─── Per-step control panels ──────────────────────────────────────────────────

function StepShape({ spec, setSpec }: { spec: CookieSpec; setSpec: React.Dispatch<React.SetStateAction<CookieSpec>> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-extrabold text-foreground text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Pick a shape
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">What shape is your cookie?</p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        {(Object.keys(SHAPES) as ShapeId[]).map((s) => {
          const active = spec.shape === s
          return (
            <button
              key={s}
              onClick={() => setSpec((p) => ({ ...p, shape: s }))}
              className="flex flex-col items-center gap-1.5 px-3 pt-3 pb-2 rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: active ? "#daa15a" : "#f5efeb",
                border: active ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.2)",
                color: active ? "#3a2620" : "#a7a19e",
                boxShadow: active ? "0 3px 12px rgba(174,38,46,0.25)" : "none",
                minWidth: 64,
              }}
            >
              <svg width="40" height="40" viewBox="0 0 300 300">
                <path d={SHAPES[s].path} fill={active ? "#ae262e" : "#d4a87a"} />
              </svg>
              {SHAPES[s].label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepDough({ spec, setSpec }: { spec: CookieSpec; setSpec: React.Dispatch<React.SetStateAction<CookieSpec>> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-extrabold text-foreground text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Choose your dough
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">Pick a texture and a colour</p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        {BASE_OPTIONS.map((b) => {
          const active = spec.base.id === b.id
          return (
            <button
              key={b.id}
              onClick={() => setSpec((p) => ({ ...p, base: { ...p.base, id: b.id } }))}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: active ? "#daa15a" : "#f5efeb",
                border: active ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.2)",
                color: active ? "#3a2620" : "#a7a19e",
                boxShadow: active ? "0 3px 12px rgba(174,38,46,0.25)" : "none",
              }}
            >
              <span className="text-2xl">{b.emoji}</span>
              {b.label}
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="text-xs font-bold text-muted-foreground">Dough colour</span>
        <ColorSwatch
          color={spec.base.color}
          onChange={(c) => setSpec((p) => ({ ...p, base: { ...p.base, color: c } }))}
          label="Dough colour"
        />
      </div>
      <div className="flex justify-center">
        <NameInput
          value={spec.base.name ?? ""}
          onChange={(v) => setSpec((p) => ({ ...p, base: { ...p.base, name: v } }))}
          placeholder="e.g. Matcha dough…"
        />
      </div>
    </div>
  )
}

function StepMixins({ spec, setSpec }: { spec: CookieSpec; setSpec: React.Dispatch<React.SetStateAction<CookieSpec>> }) {
  const addMixin = () => {
    if (spec.mixins.length >= 4) return
    setSpec((p) => ({ ...p, mixins: [...p.mixins, { id: "chip", color: "#3a2620" }] }))
  }
  const removeMixin = (i: number) =>
    setSpec((p) => ({ ...p, mixins: p.mixins.filter((_, j) => j !== i) }))
  const setMixinId = (i: number, id: MixinId) =>
    setSpec((p) => { const m = [...p.mixins]; m[i] = { ...m[i], id }; return { ...p, mixins: m } })
  const setMixinColor = (i: number, color: string) =>
    setSpec((p) => { const m = [...p.mixins]; m[i] = { ...m[i], color }; return { ...p, mixins: m } })

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-extrabold text-foreground text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Add mix-ins
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">Up to 4 — or skip and go plain</p>
      </div>
      <div className="flex flex-col gap-2 min-h-[60px]">
        {spec.mixins.length === 0 && (
          <p className="text-center text-xs text-muted-foreground italic py-2">No mix-ins yet</p>
        )}
        {spec.mixins.map((m, i) => (
          <div key={i} className="flex flex-col gap-1.5 items-center">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {MIXIN_OPTIONS.map((opt) => (
                <Chip key={opt.id} active={m.id === opt.id} onClick={() => setMixinId(i, opt.id)}>
                  {opt.label}
                </Chip>
              ))}
              <ColorSwatch color={m.color} onChange={(c) => setMixinColor(i, c)} label={`Mix-in ${i + 1} colour`} />
              <button
                onClick={() => removeMixin(i)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                aria-label="Remove"
              >✕</button>
            </div>
            <NameInput
              value={m.name ?? ""}
              onChange={(v) => setSpec((p) => {
                const mx = [...p.mixins]; mx[i] = { ...mx[i], name: v }; return { ...p, mixins: mx }
              })}
              placeholder={`e.g. Rainbow sprinkles…`}
            />
          </div>
        ))}
      </div>
      {spec.mixins.length < 4 && (
        <button
          onClick={addMixin}
          className="mx-auto px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: "#f5efeb", border: "1.5px dashed #d4a87a", color: "#a7a19e" }}
        >
          + Add a mix-in
        </button>
      )}
    </div>
  )
}

function StepTopping({ spec, setSpec }: { spec: CookieSpec; setSpec: React.Dispatch<React.SetStateAction<CookieSpec>> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-extrabold text-foreground text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Add a topping
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">Finish it off — or keep it bare</p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => setSpec((p) => ({ ...p, topping: null }))}
          className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            background: spec.topping === null ? "#daa15a" : "#f5efeb",
            border: spec.topping === null ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.2)",
            color: spec.topping === null ? "#3a2620" : "#a7a19e",
          }}
        >
          <span className="text-2xl">🚫</span>
          None
        </button>
        {TOPPING_OPTIONS.map((t) => {
          const active = spec.topping?.id === t.id
          return (
            <button
              key={t.id}
              onClick={() => setSpec((p) => ({
                ...p,
                topping: { id: t.id, color: p.topping?.color ?? "#f5efeb" },
              }))}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: active ? "#daa15a" : "#f5efeb",
                border: active ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.2)",
                color: active ? "#3a2620" : "#a7a19e",
                boxShadow: active ? "0 3px 12px rgba(174,38,46,0.25)" : "none",
              }}
            >
              <span className="text-2xl">{t.emoji}</span>
              {t.label}
            </button>
          )
        })}
      </div>
      {spec.topping && (
        <>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-bold text-muted-foreground">Topping colour</span>
            <ColorSwatch
              color={spec.topping.color}
              onChange={(c) => setSpec((p) => p.topping ? { ...p, topping: { ...p.topping, color: c } } : p)}
              label="Topping colour"
            />
          </div>
          <div className="flex justify-center">
            <NameInput
              value={spec.topping.name ?? ""}
              onChange={(v) => setSpec((p) => p.topping ? { ...p, topping: { ...p.topping, name: v } } : p)}
              placeholder="e.g. Cream cheese frosting…"
            />
          </div>
        </>
      )}
    </div>
  )
}

function StepPublish({
  onSubmit,
}: {
  onSubmit: (email: string) => void
}) {
  const [email, setEmail] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-extrabold text-foreground text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Your cookie is ready! 🎉
        </p>
        <p className="text-muted-foreground text-xs mt-1 max-w-[260px] mx-auto">
          Publish it to the gallery. Drop your email if you want to hear about future pop-ups.
        </p>
      </div>
      <div className="flex flex-col gap-2 max-w-[280px] mx-auto w-full">
        <input
          type="email"
          placeholder="your@email.com (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
          style={{
            background: "#f5efeb",
            border: "1.5px solid rgba(174,38,46,0.25)",
            color: "#3a2620",
          }}
        />
        <p className="text-xs text-muted-foreground text-center">
          Only used to notify you about pop-up events — never shared.
        </p>
      </div>
      <button
        onClick={() => onSubmit(email)}
        className="mx-auto px-10 py-4 rounded-2xl font-extrabold text-lg transition-all hover:scale-[1.04] active:scale-[0.96]"
        style={{
          background: "linear-gradient(135deg, #ae262e 0%, #daa15a 100%)",
          color: "#f5efeb",
          boxShadow: "0 5px 20px rgba(174,38,46,0.38)",
          fontFamily: "'Fredoka One', cursive",
          letterSpacing: "0.04em",
        }}
      >
        Publish to Gallery 🔥
      </button>
    </div>
  )
}

// ─── BuildScreen ─────────────────────────────────────────────────────────────

interface BuildScreenProps {
  spec: CookieSpec
  setSpec: React.Dispatch<React.SetStateAction<CookieSpec>>
  onDone: () => void
  onBack: () => void
}

function BuildScreen({ spec, setSpec, onDone, onBack }: BuildScreenProps) {
  const [step, setStep] = useState<StepIndex>(0)
  const isFirst = step === 0
  const isLast = step === (TOTAL_STEPS - 1) as StepIndex

  const goNext = () => !isLast && setStep((s) => (s + 1) as StepIndex)
  const goPrev = () => {
    if (isFirst) onBack()
    else setStep((s) => (s - 1) as StepIndex)
  }

  const stepControls = [
    <StepShape key="shape" spec={spec} setSpec={setSpec} />,
    <StepDough key="dough" spec={spec} setSpec={setSpec} />,
    <StepMixins key="mixins" spec={spec} setSpec={setSpec} />,
    <StepTopping key="topping" spec={spec} setSpec={setSpec} />,
    <StepPublish key="publish" onSubmit={(email) => {
      // TODO: wire to Supabase insert (ADR 0002 / 0003)
      console.log("submit", { spec, email })
      onDone()
    }} />,
  ]

  return (
    <div className="flex-1 flex flex-col items-center" style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>

      {/* Step dots */}
      <div className="flex items-center gap-2 pt-5 pb-2">
        {STEP_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setStep(i as StepIndex)}
            className="flex flex-col items-center gap-1 group"
            aria-label={`Go to step ${label}`}
          >
            <span
              className="block rounded-full transition-all"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                background: i < step ? "#ae262e" : i === step ? "#daa15a" : "rgba(174,38,46,0.2)",
              }}
            />
          </button>
        ))}
      </div>

      {/* Step label */}
      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">
        Step {step + 1} of {TOTAL_STEPS} — {STEP_LABELS[step]}
      </p>

      {/* Cookie canvas — fixed center */}
      <div
        className="rounded-3xl p-6 mb-6"
        style={{
          background: "linear-gradient(145deg, #f5efeb, #ede8e4)",
          border: "1.5px solid rgba(174,38,46,0.14)",
          boxShadow: "0 4px 32px rgba(174,38,46,0.1)",
        }}
      >
        <CookieCanvas spec={spec} size={240} />
      </div>

      {/* Step controls */}
      <div
        className="w-full rounded-3xl px-6 py-5 mb-5"
        style={{
          background: "#f5efeb",
          border: "1.5px solid rgba(174,38,46,0.12)",
          boxShadow: "0 2px 16px rgba(174,38,46,0.07)",
          minHeight: 160,
        }}
      >
        {stepControls[step]}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between w-full px-2 pb-8 gap-3">
        <button
          onClick={goPrev}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style={{
            background: "#f5efeb",
            border: "1.5px solid rgba(174,38,46,0.2)",
            color: "#a7a19e",
          }}
        >
          ← {isFirst ? "Home" : "Back"}
        </button>

        {!isLast && (
          <button
            onClick={goNext}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #ae262e, #daa15a)",
              color: "#f5efeb",
              boxShadow: "0 3px 12px rgba(174,38,46,0.3)",
              fontFamily: "'Fredoka One', cursive",
            }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

function HomeScreen({ onBuild, onGallery }: { onBuild: () => void; onGallery: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 pt-10 pb-12 w-full">
      <div style={{ filter: "drop-shadow(0 12px 32px rgba(174,38,46,0.25))" }}>
        <CookieCanvas
          spec={{
            shape: "circle",
            base: { id: "plain", color: "#daa15a" },
            mixins: [{ id: "chip", color: "#3a2620" }, { id: "chip", color: "#6e1d18" }],
            topping: null,
          }}
          size={180}
        />
      </div>
      <div className="text-center flex flex-col gap-1.5">
        <h2 className="text-3xl text-foreground" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Tell us your perfect Kinsco cookie
        </h2>
        <p className="text-muted-foreground text-sm font-semibold max-w-xs mx-auto">
          dough, flavor combos, topping, bake!.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onBuild}
          className="w-full py-4 rounded-2xl font-extrabold text-lg transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #ae262e 0%, #daa15a 100%)",
            color: "#f5efeb",
            boxShadow: "0 5px 20px rgba(174,38,46,0.35)",
            fontFamily: "'Fredoka One', cursive",
            letterSpacing: "0.04em",
          }}
        >
          Build a Cookie 🍪
        </button>
        <button
          onClick={onGallery}
          className="w-full py-4 rounded-2xl font-extrabold text-lg transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "#f5efeb",
            color: "#ae262e",
            border: "2px solid #daa15a",
            boxShadow: "0 2px 12px rgba(174,38,46,0.12)",
            fontFamily: "'Fredoka One', cursive",
            letterSpacing: "0.04em",
          }}
        >
          See the Gallery ✨
        </button>
      </div>
    </div>
  )
}

// ─── GalleryScreen ────────────────────────────────────────────────────────────

function GalleryScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-5xl">🖼️</p>
      <h2 className="text-2xl text-foreground" style={{ fontFamily: "'Fredoka One', cursive" }}>
        Gallery coming soon
      </h2>
      <p className="text-muted-foreground text-sm font-semibold max-w-xs">
        Submitted cookies will appear here once Supabase is wired up.
      </p>
      <button
        onClick={onBack}
        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
        style={{ background: "#f5efeb", border: "1.5px solid rgba(174,38,46,0.2)", color: "#a7a19e" }}
      >
        ← Back
      </button>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Screen = "home" | "build" | "gallery" | "done"

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")
  const [spec, setSpec] = useState<CookieSpec>(DEFAULT_SPEC)

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-border text-center py-4 flex items-center px-5 shrink-0">
        {screen !== "home" && screen !== "done" && (
          <button
            onClick={() => setScreen("home")}
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            style={{ minWidth: 56 }}
          >
            ← Home
          </button>
        )}
        <h1
          className="text-2xl text-foreground mx-auto"
          style={{ fontFamily: "'Fredoka One', cursive", letterSpacing: "0.03em" }}
        >
          🍪 Cookie Canvas
        </h1>
        {screen !== "home" && screen !== "done" && <span style={{ minWidth: 56 }} />}
      </header>

      {screen === "home" && (
        <HomeScreen onBuild={() => { setSpec(DEFAULT_SPEC); setScreen("build") }} onGallery={() => setScreen("gallery")} />
      )}
      {screen === "gallery" && <GalleryScreen onBack={() => setScreen("home")} />}
      {screen === "build" && (
        <BuildScreen
          spec={spec}
          setSpec={setSpec}
          onBack={() => setScreen("home")}
          onDone={() => setScreen("done")}
        />
      )}
      {screen === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12 text-center">
          <div style={{ filter: "drop-shadow(0 12px 32px rgba(174,38,46,0.3))" }}>
            <CookieCanvas spec={spec} size={200} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl text-foreground" style={{ fontFamily: "'Fredoka One', cursive" }}>
              Cookie published! 🎊
            </h2>
            <p className="text-muted-foreground text-sm font-semibold max-w-xs mx-auto">
              Your cookie is in the gallery. Thanks for baking with us!
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setSpec(DEFAULT_SPEC); setScreen("build") }}
              className="px-6 py-3 rounded-2xl font-extrabold text-sm transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #ae262e, #daa15a)",
                color: "#f5efeb",
                fontFamily: "'Fredoka One', cursive",
              }}
            >
              Make another 🍪
            </button>
            <button
              onClick={() => setScreen("gallery")}
              className="px-6 py-3 rounded-2xl font-extrabold text-sm transition-all hover:scale-105"
              style={{ background: "#f5efeb", border: "2px solid #daa15a", color: "#ae262e", fontFamily: "'Fredoka One', cursive" }}
            >
              See gallery ✨
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
