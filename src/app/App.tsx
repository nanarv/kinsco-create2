import { useState, useId, useEffect, useRef } from "react"
import kinscoLogo from "../imports/Screenshot_2026-06-28_at_1.34.02_PM-jukebox-bg-removed.png"
import heroGraphic from "../imports/Music___Entertainment_Mobile_Website_in_Black_and_White_Basic_Minimal_Style__1080_x_1180_px_.png"
import buttonFrame from "../imports/Music___Entertainment_Mobile_Website_in_Black_and_White_Basic_Minimal_Style__1080_x_1180_px___4_.png"
import galleryButton from "../imports/Music___Entertainment_Mobile_Website_in_Black_and_White_Basic_Minimal_Style__1080_x_1180_px___5_.png"
import borderFrame from "../imports/Music___Entertainment_Mobile_Website_in_Black_and_White_Basic_Minimal_Style__1080_x_1180_px___7_.png"
import colorButtonShape from "../imports/Untitled_Artwork_3.png"
import previewBorder1 from "../imports/border1.png"
import previewBorder2 from "../imports/border2.png"
import previewBorder3 from "../imports/border3.png"
import previewBorder4 from "../imports/border4.png"
import previewBorder5 from "../imports/border5.png"
import previewBorder6 from "../imports/border6.png"

// ─── Types ────────────────────────────────────────────────────────────────────

type ShapeId = "circle" | "square" | "heart" | "star" | "blob" | ""
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
  "": {
    label: "",
    path: "",
  },
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

function PlainTexture() {
  return (
    <>
      <rect width="300" height="300" fill="#e0e0e0" />
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

// ─── Mixin icons (48×48) ──────────────────────────────────────────────────────

function ChipMixin({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" overflow="visible">
      <path
        d="M24,6 C19,11 10,20 10,31 C10,40 16,46 24,46 C32,46 38,40 38,31 C38,20 29,11 24,6Z"
        fill={color}
      />
      <path d="M14,36 C12,42 16,46 24,46 C32,46 36,42 34,36Z" fill="rgba(0,0,0,0.22)" />
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

// ─── Topping icons ────────────────────────────────────────────────────────────

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
  const lines: [number, number, number, number, number, number, number][] = [
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
      </defs>

      <path d={shapePath} fill="rgba(110,29,24,0.12)" transform="translate(2,10)" />

      <g clipPath={`url(#${clipId})`}>
        <g style={{ isolation: "isolate" }}>
          <rect width="300" height="300" fill={safeSpec.base?.color ?? "#daa15a"} />
          <g style={{ mixBlendMode: "multiply" }}>
            <BaseTexture />
          </g>
        </g>

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

        {safeSpec.topping && (() => {
          const Comp = TOPPING_COMPONENTS[safeSpec.topping!.id] ?? SwirlTopping
          return <Comp color={safeSpec.topping!.color} />
        })()}

        <rect width="300" height="300" fill={`url(#${vignetteId})`} style={{ pointerEvents: "none" }} />
      </g>

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

const DOUGH_COLORS = [
  // Left side (top to bottom)
  { color: "#6E4A72", name: "Fig Purple" },
  { color: "#6B88A8", name: "Ceramic Blue" },
  { color: "#4F6A4D", name: "Rosemary Green" },
  { color: "#9FB28A", name: "Pistachio Green" },
  { color: "#E4C16D", name: "Custard Yellow" },
  // Right side (top to bottom)
  { color: "#E6C95A", name: "Lemon Yellow" },
  { color: "#D88243", name: "Marmalade" },
  { color: "#D59A9B", name: "Rhubarb Pink" },
  { color: "#B11D24", name: "KinSco Red" },
  { color: "#A7A19E", name: "Gray" },
]

const BASE_OPTIONS: { id: BaseId; label: string; emoji: string }[] = [
  { id: "plain", label: "Classic", emoji: "🍪" },
  { id: "choc", label: "Chocolate", emoji: "🍫" },
  { id: "sugar", label: "Sugar", emoji: "✨" },
]

const MIXIN_OPTIONS: { id: MixinId; label: string }[] = [
  { id: "chip", label: "drops" },
  { id: "sprinkle", label: "sprinkles" },
  { id: "nut", label: "balls" },
]

const TOPPING_OPTIONS: { id: ToppingId; label: string; emoji: string }[] = [
  { id: "swirl", label: "Frosting", emoji: "🌀" },
  { id: "drizzle", label: "Drizzle", emoji: "〰️" },
  { id: "dust", label: "Sugar Dust", emoji: "✨" },
]

const DEFAULT_SPEC: CookieSpec = {
  shape: "circle",
  base: { id: "plain", color: "#D9A15A" },
  mixins: [],
  topping: null,
}

// ─── ColorSwatch ──────────────────────────────────────────────────────────────

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
        background: active ? "#b11d24" : "#f5efeb",
        border: active ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.22)",
        color: active ? "#ffffff" : "#a7a19e",
        boxShadow: active ? "0 2px 8px rgba(174,38,46,0.2)" : "none",
      }}
    >
      {children}
    </button>
  )
}

// ─── NameInput ────────────────────────────────────────────────────────────────

function NameInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs font-bold" style={{ color: "#a7a19e" }}> Flavor: </span>
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

// ─── SectionLabel ─────────────────────────────────────────────────────────────

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

const STEP_LABELS = ["Dough", "Mix-ins", "Topping", "Publish"] as const
type StepIndex = 0 | 1 | 2 | 3
const TOTAL_STEPS = STEP_LABELS.length

// ─── Per-step panels ──────────────────────────────────────────────────────────

function StepShape({ spec, setSpec }: { spec: CookieSpec; setSpec: React.Dispatch<React.SetStateAction<CookieSpec>> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-extrabold text-foreground text-lg" style={{ fontFamily: "Arial, sans-serif" }}>
          Pick a shape
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">What shape is your cookie?</p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        {(Object.keys(SHAPES) as ShapeId[]).filter(s => s !== "").map((s) => {
          const active = spec.shape === s
          return (
            <button
              key={s}
              onClick={() => setSpec((p) => ({ ...p, shape: s }))}
              className="flex flex-col items-center gap-1.5 px-3 pt-3 pb-2 rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: active ? "#b11d24" : "#f5efeb",
                border: active ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.2)",
                color: active ? "#ffffff" : "#a7a19e",
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

// Border animation component
const BORDER_FRAMES = [previewBorder1, previewBorder2, previewBorder3, previewBorder4, previewBorder5, previewBorder6]

function AnimatedBorder({ onAnimate, onComplete }: { onAnimate?: number; onComplete?: () => void }) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!onAnimate || onAnimate === 0) return

    setCurrentFrame(1)
    let frameIndex = 1
    const interval = setInterval(() => {
      frameIndex++
      if (frameIndex >= BORDER_FRAMES.length) {
        setCurrentFrame(0)
        clearInterval(interval)
        onCompleteRef.current?.()
      } else {
        setCurrentFrame(frameIndex)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [onAnimate])

  return (
    <img
      src={BORDER_FRAMES[currentFrame]}
      alt=""
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  )
}

function StepDough({ spec, setSpec, onDoughSelect }: { spec: CookieSpec; setSpec: React.Dispatch<React.SetStateAction<CookieSpec>>; onDoughSelect: () => void }) {
  const leftColors = DOUGH_COLORS.slice(0, 5)
  const rightColors = DOUGH_COLORS.slice(5, 10)
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const pendingColorRef = useRef<string | null>(null)

  const handleColorClick = (color: string) => {
    pendingColorRef.current = color
    setSelectedColor(color)
    onDoughSelect()
    setAnimationTrigger(prev => prev + 1)
  }

  const handleAnimationComplete = () => {
    if (pendingColorRef.current) {
      setSpec((p) => ({ ...p, base: { ...p.base, color: pendingColorRef.current! } }))
      pendingColorRef.current = null
      setSelectedColor(null)
    }
  }

  const activeButtonColor = selectedColor ?? spec.base.color
  
  return (
    <div className="flex flex-col gap-3">
      {/* Layout: 5 buttons | preview | 5 buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Left column - 5 buttons stacked vertically */}
        <div className="flex flex-col gap-2">
          {leftColors.map((item) => {
            const isActive = activeButtonColor === item.color
            return (
              <button
                key={item.color}
                onClick={() => handleColorClick(item.color)}
                className="relative transition-all hover:scale-110 active:scale-95"
                style={{
                  width: 48,
                  height: 48,
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
                title={item.name}
                aria-label={item.name}
              >
                <img 
                  src={colorButtonShape} 
                  alt=""
                  style={{ 
                    width: "100%",
                    height: "100%",
                    filter: `brightness(0) saturate(100%) opacity(1)`,
                    position: "absolute",
                    inset: 0,
                  }}
                />
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: item.color,
                    maskImage: `url(${colorButtonShape})`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskImage: `url(${colorButtonShape})`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                  }}
                />
                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: "3px solid #b11d24",
                      borderRadius: "50%",
                      boxShadow: "0 0 0 2px #f5efeb, 0 0 8px rgba(177,29,36,0.5)",
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Center preview */}
        <div
          className="rounded-3xl flex-shrink-0 relative"
          style={{
            width: 150,
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Background */}
          <div 
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(145deg, #f5efeb, #ede8e4)",
              borderRadius: 24,
            }}
          />
          {/* Animated border overlay */}
          <AnimatedBorder onAnimate={animationTrigger} onComplete={handleAnimationComplete} />
          {/* Cookie preview */}
          <svg width="120" height="120" viewBox="0 0 300 300" style={{ display: "block", position: "relative", zIndex: 1 }}>
            <ellipse cx="150" cy="150" rx="120" ry="100" fill={spec.base.color} />
            <ellipse cx="150" cy="150" rx="120" ry="100" fill="rgba(0,0,0,0.1)" opacity="0.3" style={{ mixBlendMode: "multiply" }} />
            <ellipse cx="120" cy="120" rx="40" ry="30" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>

        {/* Right column - 5 buttons stacked vertically */}
        <div className="flex flex-col gap-2">
          {rightColors.map((item) => {
            const isActive = activeButtonColor === item.color
            return (
              <button
                key={item.color}
                onClick={() => handleColorClick(item.color)}
                className="relative transition-all hover:scale-110 active:scale-95"
                style={{
                  width: 48,
                  height: 48,
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
                title={item.name}
                aria-label={item.name}
              >
                <img 
                  src={colorButtonShape} 
                  alt=""
                  style={{ 
                    width: "100%",
                    height: "100%",
                    filter: `brightness(0) saturate(100%) opacity(1)`,
                    position: "absolute",
                    inset: 0,
                  }}
                />
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: item.color,
                    maskImage: `url(${colorButtonShape})`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskImage: `url(${colorButtonShape})`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                  }}
                />
                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: "3px solid #b11d24",
                      borderRadius: "50%",
                      boxShadow: "0 0 0 2px #f5efeb, 0 0 8px rgba(177,29,36,0.5)",
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom name below */}
      <div className="flex justify-center mt-2">
        <NameInput
          value={spec.base.name ?? ""}
          onChange={(v) => setSpec((p) => ({ ...p, base: { ...p.base, name: v } }))}
          placeholder="........................................"
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
        <p className="font-extrabold text-foreground text-lg" style={{ fontFamily: "Arial, sans-serif" }}>
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
        <p className="font-extrabold text-foreground text-lg" style={{ fontFamily: "Arial, sans-serif" }}>
          Add a topping
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">Finish it off — or keep it bare</p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => setSpec((p) => ({ ...p, topping: null }))}
          className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            background: spec.topping === null ? "#b11d24" : "#f5efeb",
            border: spec.topping === null ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.2)",
            color: spec.topping === null ? "#ffffff" : "#a7a19e",
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
                background: active ? "#b11d24" : "#f5efeb",
                border: active ? "2px solid #ae262e" : "1.5px solid rgba(174,38,46,0.2)",
                color: active ? "#ffffff" : "#a7a19e",
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

function StepPublish({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="font-extrabold text-foreground text-xl" style={{ fontFamily: "Arial, sans-serif" }}>
          all done !
        </p>
        <p className="text-muted-foreground text-xs mt-1 max-w-[260px] mx-auto">
          get it touch !
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
        <div className="flex flex-col gap-0.5 text-center">
          <p className="text-xs text-muted-foreground">will be use to notify you about future pop-up</p>
          <p className="text-xs text-muted-foreground">we promise we won't share your info!</p>
        </div>
      </div>
      <button
        onClick={() => onSubmit(email)}
        className="mx-auto px-10 py-4 rounded-2xl font-extrabold text-lg transition-all hover:scale-[1.04] active:scale-[0.96]"
        style={{
          background: "#b11d24",
          color: "#f5efeb",
          boxShadow: "0 5px 20px rgba(174,38,46,0.38)",
          fontFamily: "Arial, sans-serif",
          letterSpacing: "0.04em",
        }}
      >
        submit cookie
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
  const [hasSelectedDough, setHasSelectedDough] = useState(false)
  const isFirst = step === 0
  const isLast = step === (TOTAL_STEPS - 1) as StepIndex

  const goNext = () => !isLast && setStep((s) => (s + 1) as StepIndex)
  const goPrev = () => {
    if (isFirst) onBack()
    else setStep((s) => (s - 1) as StepIndex)
  }

  const stepControls = [
    <StepDough key="dough" spec={spec} setSpec={setSpec} onDoughSelect={() => setHasSelectedDough(true)} />,
    <StepMixins key="mixins" spec={spec} setSpec={setSpec} />,
    <StepTopping key="topping" spec={spec} setSpec={setSpec} />,
    <StepPublish key="publish" onSubmit={(email) => {
      console.log("submit", { spec, email })
      onDone()
    }} />,
  ]

  return (
    <div className="flex-1 flex flex-col overflow-y-auto" style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>

      {/* For step 0, center everything vertically */}
      {step === 0 ? (
        <div className="flex items-center justify-center px-6" style={{ marginTop: 100 }}>
          <div
            className="w-full rounded-3xl px-6 py-5"
            style={{
              background: "#f5efeb",
              border: "1.5px solid rgba(174,38,46,0.12)",
              boxShadow: "0 2px 16px rgba(174,38,46,0.07)",
            }}
          >
            {stepControls[step]}
          </div>
        </div>
      ) : (
        <>
          {/* Hide the preview box on step 0 since preview is shown in StepDough between buttons */}
          {step !== 0 && (
            <div
              className="rounded-3xl p-6 mb-6 mx-auto"
              style={{
                background: "linear-gradient(145deg, #f5efeb, #ede8e4)",
                border: "1.5px solid rgba(174,38,46,0.14)",
                boxShadow: "0 4px 32px rgba(174,38,46,0.1)",
                width: 252,
                height: 252,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CookieCanvas spec={spec} size={240} />
            </div>
          )}

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
        </>
      )}

      <div className="flex items-center justify-center w-full px-2 gap-6" style={step === 0 ? { marginTop: 16 } : {}}>
        <button
          onClick={goPrev}
          className="transition-all hover:opacity-80 active:scale-95"
          style={{ background: "none", border: "none", padding: 0 }}
        >
          <img
            src={isFirst ? "/Home-button.png" : "/Back-button.png"}
            alt={isFirst ? "Home" : "Back"}
            style={{ height: 48, width: "auto", display: "block" }}
          />
        </button>

        {!isLast && (
          <button
            onClick={goNext}
            className="transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "none", border: "none", padding: 0 }}
          >
            <img
              src="/Next-button.png"
              alt="Next"
              style={{ height: 48, width: "auto", display: "block" }}
            />
          </button>
        )}
      </div>

      {/* Step progress — bottom */}
      <div className="flex flex-col items-center gap-2 pt-3 pb-6">
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => setStep(i as StepIndex)}
              aria-label={`Go to step ${label}`}
            >
              <span
                className="block rounded-full transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  background: i < step ? "#b11d24" : i === step ? "#b11d24" : "rgba(177,29,36,0.2)",
                }}
              />
            </button>
          ))}
        </div>
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
          Step {step + 1} of {TOTAL_STEPS} — {STEP_LABELS[step]}
        </p>
      </div>
    </div>
  )
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

function HomeScreen({ onBuild, onGallery }: { onBuild: () => void; onGallery: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 pt-4 pb-12 w-full">
      <img
        src={heroGraphic}
        alt="Kinsco cookie graphic"
        style={{ width: "100%", maxWidth: 340, height: "auto", marginTop: 24 }}
      />
      <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: 260, marginTop: -35 }}>
        <button
          onClick={onBuild}
          className="transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: "none", border: "none", padding: 0, width: "80%", display: "block" }}
        >
          <img src={buttonFrame} alt="Start Here" style={{ width: "100%", height: "auto", display: "block" }} />
        </button>
        <button
          onClick={onGallery}
          className="transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: "none", border: "none", padding: 0, width: "70%", display: "block",  marginTop: -15 }}
        >
          <img src={galleryButton} alt="See Other Peep's" style={{ width: "100%", height: "auto", display: "block" }} />
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
      <h2 className="text-2xl text-foreground" style={{ fontFamily: "Arial, sans-serif" }}>
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

  const content = (
    <div
      className="flex flex-col bg-background"
      style={{ fontFamily: "Arial, sans-serif", minHeight: "100%", width: "100%" }}
    >
      {/* Logo header — every screen */}
      <div className="flex justify-center pt-4 pb-2" style={{ marginTop: 80 }}>
        <img src={kinscoLogo} alt="Kinsco" style={{ height: 52, width: "auto" }} />
      </div>

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
            <h2 className="text-3xl text-foreground" style={{ fontFamily: "Arial, sans-serif" }}>
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
              style={{ background: "#b11d24", color: "#f5efeb", fontFamily: "Arial, sans-serif" }}
            >
              Make another
            </button>
            <button
              onClick={() => setScreen("gallery")}
              className="px-6 py-3 rounded-2xl font-extrabold text-sm transition-all hover:scale-105"
              style={{ background: "#f5efeb", border: "2px solid #daa15a", color: "#ae262e", fontFamily: "Arial, sans-serif" }}
            >
              See gallery
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile: full screen */}
      <div className="sm:hidden min-h-screen bg-background relative">
        {content}
        {/* Border overlay */}
        <img
          src={borderFrame}
          alt=""
          className="pointer-events-none fixed inset-0 w-full h-full"
          style={{ zIndex: 9999, objectFit: 'fill', filter: 'sepia(1) hue-rotate(320deg) saturate(8) brightness(0.38)' }}
        />
      </div>

      {/* Desktop: centered mobile shell */}
      <div
        className="hidden sm:flex min-h-screen items-center justify-center"
        style={{ background: "#f0ebe6" }}
      >
        <div
          className="relative overflow-hidden"
          style={{ width: 390, height: 844, borderRadius: 40, boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}
        >
          <div className="absolute inset-0 overflow-y-auto">
            {content}
          </div>
          {/* Border overlay for desktop */}
          <img
            src={borderFrame}
            alt=""
            className="pointer-events-none absolute inset-0 w-full h-full"
            style={{ zIndex: 9999, borderRadius: 40, objectFit: 'fill', filter: 'sepia(1) hue-rotate(320deg) saturate(8) brightness(0.38)' }}
          />
        </div>
      </div>
    </>
  )
}