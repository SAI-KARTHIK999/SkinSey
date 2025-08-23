import Image from "next/image"

interface ChanseyMascotProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function ChanseyMascot({ size = "md", className = "" }: ChanseyMascotProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Image src="/chansey-mascot.png" alt="Chansey - Skinsey Mascot" width={96} height={96} className="w-full h-full object-contain" />
    </div>
  )
}
