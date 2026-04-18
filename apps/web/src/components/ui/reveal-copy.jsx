import { useState, useCallback } from "react"
import { cn } from "../../lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { Eye, EyeOff, Copy, Check } from "lucide-react"

/**
 * RevealCopy — Specialized for Wallets
 * Masks middle with XXXXX, reveals on click, and has a dedicated green copy button.
 */
export function RevealCopy({
  value,
  className,
  truncate = true,
  chars = 6,
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const mask = "*****"
  const displayValue = truncate && value
    ? `${value.slice(0, chars)}...${mask}...${value.slice(-chars)}`
    : value

  const handleCopy = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const el = document.createElement("textarea")
      el.value = value
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [value])

  const toggleReveal = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setRevealed(!revealed)
  }

  if (!value) {
    return (
      <span className={cn("font-mono text-[10px] text-gray-400 italic", className)}>
        Pending deployment…
      </span>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div 
        className={cn(
          "inline-flex items-center gap-1.5 p-1 rounded-xl bg-gray-50 border border-gray-100 group/reveal transition-all duration-200 hover:shadow-sm",
          className
        )}
      >
        {/* The Address Display */}
        <div className="px-1.5 py-0.5 min-w-0 pointer-events-none">
          <span
            className={cn(
              "font-mono text-[10px] tracking-wider transition-all duration-300",
              revealed ? "text-gray-900" : "text-gray-400 select-none"
            )}
          >
            {revealed ? value : displayValue}
          </span>
        </div>

        {/* Visual Cues Group */}
        <div className="flex items-center gap-1">
          {/* Eye Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleReveal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                {revealed ? (
                  <EyeOff className="w-3 h-3 text-blue-500" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {revealed ? "Hide Address" : "Show Full Address"}
            </TooltipContent>
          </Tooltip>

          <div className="w-[1px] h-3 bg-gray-200 mx-0.5" />

          {/* Copy Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "p-1 rounded-lg transition-all duration-200 flex items-center justify-center",
                  copied 
                    ? "bg-green-500 text-white" 
                    : "bg-green-50 text-green-600 hover:bg-green-100 active:scale-95 shadow-sm"
                )}
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {copied ? "Copied!" : "Copy Full Address"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
