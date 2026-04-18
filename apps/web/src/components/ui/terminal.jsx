import { useState, useEffect, useRef } from 'react'
import { Check, Copy, Terminal as TerminalIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '../../lib/utils'

// Typing sound URL (subtle mechanical click)
const TYPING_SOUND = "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sounds/click.mp3"

/**
 * Typewriter — Sub-component to handle the typing animation
 */
function Typewriter({ text, speed = 20, delay = 0, onComplete, playSound = false }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (playSound && !audioRef.current) {
      audioRef.current = new Audio(TYPING_SOUND)
      audioRef.current.volume = 0.05 // Very subtle
    }

    let timeout
    let currentIndex = 0

    const type = () => {
      if (currentIndex < text.length) {
        const nextChar = text[currentIndex]
        setDisplayedText(prev => prev + nextChar)

        // Play sound on non-whitespace
        if (playSound && nextChar.trim()) {
          audioRef.current?.cloneNode()?.play().catch(() => { })
        }

        currentIndex++
        timeout = setTimeout(type, speed)
      } else {
        setIsComplete(true)
        onComplete?.()
      }
    }

    const initialDelay = setTimeout(type, delay)
    return () => {
      clearTimeout(timeout)
      clearTimeout(initialDelay)
    }
  }, [text, speed, delay, playSound])

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-[6px] h-[14px] bg-green-500 ml-1 translate-y-[2px]"
        />
      )}
    </span>
  )
}

/**
 * Terminal — A premium, animated terminal component for code examples.
 */
export function Terminal({
  command,
  output,
  showControls = true,
  className,
  isAnimated = true,
  typingSpeed = 25
}) {
  const [copied, setCopied] = useState(false)
  const [showOutput, setShowOutput] = useState(!isAnimated)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy command:', err)
    }
  }

  return (
    <div className={cn(
      "w-full rounded-xl bg-[#0f0f0f] border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] font-mono text-sm group/terminal",
      className
    )}>
      {/* Header / Window Controls */}
      <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showControls && (
            <div className="flex gap-1.5 min-w-12">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
          )}
          <div className="flex items-center gap-2 text-white/20">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-widest font-bold">tryghost-cli</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="text-white/20 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-md"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Terminal Body */}
      <div className="p-6 overflow-x-auto min-h-[120px]">
        {/* Command Line */}
        <div className="flex gap-3 text-zinc-300">
          <span className="text-zinc-500 select-none">$</span>
          <span className="whitespace-pre-wrap">
            {isAnimated ? (
              <Typewriter
                text={command}
                speed={typingSpeed}
                playSound={true}
                onComplete={() => setShowOutput(true)}
              />
            ) : command}
          </span>
        </div>

        {/* Output */}
        <AnimatePresence>
          {showOutput && output && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4 pt-4 border-t border-white/[0.03] text-zinc-500 leading-relaxed font-mono text-xs"
            >
              <span className="whitespace-pre-wrap">{output}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
