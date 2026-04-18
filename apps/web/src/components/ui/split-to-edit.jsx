import { useState, useRef, useEffect } from "react"
import {
  motion,
  AnimatePresence,
  MotionConfig,
} from "motion/react"
import { Check, Pencil } from "lucide-react"
import { cn } from "../../lib/utils"

const layoutConfig = {
  type: "spring",
  stiffness: 450,
  damping: 25,
  mass: 2,
}

const collapsedConfig = {
  type: "spring",
  stiffness: 450,
  damping: 25,
  mass: 1,
}

/**
 * SplitToEdit — Watermelon-inspired animated time picker
 * Props:
 *  initialHours: number (0–23)
 *  onSave: (hours) => void  — we only handle hours since the policy uses integer hours
 *  label: string
 */
export function SplitToEdit({ initialHours = 9, onSave, label }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hours, setHours] = useState(initialHours)
  const [tempHours, setTempHours] = useState(String(initialHours))
  const hoursInputRef = useRef(null)

  useEffect(() => {
    setHours(initialHours)
    setTempHours(String(initialHours))
  }, [initialHours])

  useEffect(() => {
    if (isExpanded) {
      const t = setTimeout(() => {
        hoursInputRef.current?.focus()
        hoursInputRef.current?.select()
      }, 50)
      return () => clearTimeout(t)
    }
  }, [isExpanded])

  const handleEdit = () => {
    setTempHours(String(hours))
    setIsExpanded(true)
  }

  const handleSave = () => {
    const h = Math.min(23, Math.max(0, parseInt(tempHours) || 0))
    setHours(h)
    setTempHours(String(h))
    setIsExpanded(false)
    onSave?.(h)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") setIsExpanded(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-gray-500">{label}</span>}
      <MotionConfig transition={isExpanded ? layoutConfig : collapsedConfig}>
        <motion.div
          layout
          className={cn("flex items-center font-mono", isExpanded && "gap-3")}
        >
          {/* Hours block */}
          <motion.div
            layout
            animate={{
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              borderTopRightRadius: isExpanded ? 8 : 0,
              borderBottomRightRadius: isExpanded ? 8 : 0,
            }}
            className={cn(
              "flex cursor-pointer items-center justify-end gap-1 bg-gray-100 px-1 pl-2 border border-gray-200",
              isExpanded && "gap-4 px-3"
            )}
            onClick={!isExpanded ? handleEdit : undefined}
          >
            <motion.input
              ref={hoursInputRef}
              layout
              value={tempHours}
              onChange={(e) =>
                setTempHours(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              readOnly={!isExpanded}
              onKeyDown={handleKeyDown}
              className="h-10 w-[2ch] bg-transparent text-center font-mono text-xl font-semibold text-gray-900 outline-none"
            />
            <motion.span
              layout
              className="text-sm font-medium text-gray-500"
            >
              hr
            </motion.span>
          </motion.div>

          {/* UTC label (visible when collapsed) */}
          {!isExpanded && (
            <motion.div
              layout
              animate={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              className="flex cursor-pointer items-center bg-gray-100 border-t border-b border-gray-200 px-2"
              onClick={handleEdit}
            >
              <span className="h-10 flex items-center text-xs text-gray-400 font-medium">UTC</span>
            </motion.div>
          )}

          {/* Action button */}
          <motion.div
            layout
            animate={{
              borderTopLeftRadius: isExpanded ? 8 : 0,
              borderBottomLeftRadius: isExpanded ? 8 : 0,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            }}
            className="flex h-10 w-10 items-center justify-center bg-gray-100 border border-gray-200"
          >
            <button
              onClick={isExpanded ? handleSave : handleEdit}
              className="cursor-pointer flex items-center justify-center w-full h-full"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={isExpanded ? "check" : "pen"}
                  initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                  transition={{ type: "spring", visualDuration: 0.25, bounce: 0 }}
                >
                  {isExpanded ? (
                    <Check className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Pencil className="w-4 h-4 text-gray-500" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </motion.div>
        </motion.div>
      </MotionConfig>
    </div>
  )
}
