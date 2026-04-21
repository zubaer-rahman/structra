'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Download, RotateCcw } from 'lucide-react'

interface SignaturePadProps {
  onSignatureChange?: (signatureData: string | null) => void
  width?: number
  height?: number
  penColor?: string
  backgroundColor?: string
  className?: string
  disabled?: boolean
}

export function SignaturePad({
  onSignatureChange,
  width = 400,
  height = 200,
  penColor = '#000000',
  backgroundColor = '#ffffff',
  className = '',
  disabled = false
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Get mouse/touch position
  const getPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if (e instanceof MouseEvent) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    } else {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      }
    }
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Set default styles
    ctx.strokeStyle = penColor
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }, [width, height, penColor, backgroundColor])

  // Add touch event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled) return
      e.preventDefault()
      setIsDrawing(true)
      const point = getPoint(e)
      setLastPoint(point)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing || disabled) return
      e.preventDefault()
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx || !lastPoint) return

      const currentPoint = getPoint(e)
      
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()
      
      setLastPoint(currentPoint)
      setHasSignature(true)
      
      // Notify parent component
      const signatureData = canvas.toDataURL('image/png')
      onSignatureChange?.(signatureData)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      if (!isDrawing) return
      setIsDrawing(false)
      setLastPoint(null)
    }

    // Add touch event listeners with passive: false
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Cleanup function
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [disabled, isDrawing, lastPoint, getPoint, onSignatureChange])

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    
    e.preventDefault()
    setIsDrawing(true)
    const point = getPoint(e.nativeEvent)
    setLastPoint(point)
  }, [disabled, getPoint])

  // Draw line
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return
    
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !lastPoint) return

    const currentPoint = getPoint(e.nativeEvent)
    
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()
    
    setLastPoint(currentPoint)
    setHasSignature(true)
    
    // Notify parent component
    const signatureData = canvas.toDataURL('image/png')
    onSignatureChange?.(signatureData)
  }, [isDrawing, disabled, lastPoint, getPoint, onSignatureChange])

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    setLastPoint(null)
  }, [isDrawing])

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
    setHasSignature(false)
    onSignatureChange?.(null)
  }, [backgroundColor, width, height, onSignatureChange])

  // Download signature
  const downloadSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const link = document.createElement('a')
    link.download = `signature-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [hasSignature])

  return (
    <div className={`signature-pad ${className}`}>
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ 
            width: `${width}px`, 
            height: `${height}px`,
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none' // Prevent default touch behaviors
          }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            className="flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSignature}
            disabled={disabled || !hasSignature}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
        
        {hasSignature && (
          <div className="text-sm text-green-600 font-medium">
            ✓ Signature captured
          </div>
        )}
      </div>
    </div>
  )
}

export default SignaturePad
