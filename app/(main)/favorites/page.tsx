"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HighlightCard } from "@/components/highlight-card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, AlertCircle, Heart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FavoritesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [highlights, setHighlights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHighlights = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data: highlightsData, error: highlightsError } = await supabase
        .from("highlights")
        .select(`
          *,
          books (
            title,
            author
          )
        `)
        .eq("favorite", true)
        .order("created_at", { ascending: false })

      if (highlightsError) throw highlightsError

      setHighlights(highlightsData || [])
    } catch (err: any) {
      console.error("Error fetching favorites:", err)
      setError(err.message || "Failed to load favorites")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchHighlights()
    }
  }, [user])

  const handleAddHighlight = () => {
    router.push("/favorites/add")
  }

  const handleEditHighlight = (id: string) => {
    router.push(`/favorites/${id}/edit`)
  }

  const handleDeleteHighlight = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("highlights").delete().eq("id", id)

      if (error) throw error

      // Refresh the favorites list
      fetchHighlights()
    } catch (err: any) {
      console.error("Error deleting favorite:", err)
      setError(err.message || "Failed to delete favorite")
    }
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase.from("highlights").update({ favorite: !currentFavorite }).eq("id", id)

      if (error) throw error

      if (currentFavorite) {
        setHighlights(highlights.filter((h) => h.id !== id))
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err)
      setError(err.message || "Failed to update favorite")
      throw err
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">Favorites</h1>
          <p className="text-muted-foreground mt-2">Your favorite highlights in one place.</p>
        </div>
        <Button onClick={handleAddHighlight}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Highlight
        </Button>
      </div>

      {error && (
        <Alert className="border border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {highlights.length === 0 && !isLoading && !error ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6">Mark highlights as favorites by clicking the heart icon</p>
        </div>
      ) : (
        <div className="space-y-10">
          {highlights.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              id={highlight.id}
              content={highlight.content}
              bookTitle={highlight.books?.title || "Unknown Book"}
              author={highlight.books?.author}
              createdAt={new Date(highlight.created_at)}
              favorite={highlight.favorite}
              onEdit={handleEditHighlight}
              onDelete={handleDeleteHighlight}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
