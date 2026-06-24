import { BookMarked } from "lucide-react"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="rounded-full bg-primary/10 p-2">
        <BookMarked className="h-6 w-6 text-primary" />
      </div>
      <span className="text-2xl font-semibold tracking-tight">Tomorrow</span>
    </Link>
  )
}
