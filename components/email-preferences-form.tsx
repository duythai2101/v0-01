"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { safeQuery } from "@/lib/supabase-helpers"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface HighlightOption {
  id: string
  content: string
  bookTitle: string
}

export function EmailPreferencesForm() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isRandom, setIsRandom] = useState(true)
  const [sendTime, setSendTime] = useState("08:00")
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<HighlightOption[]>([])
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Time options for the dropdown
  const timeOptions = [
    { value: "06:00", label: "6:00 AM" },

  ]

  // Load user's email preferences and highlights
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setIsLoading(true)
      setMessage(null)

      try {
        // Load email preferences
        const { data: preferences, error: preferencesError } = await safeQuery(() =>
          supabase.from("email_preferences").select("*").eq("user_id", user.id).single(),
        )

        if (preferencesError && !preferencesError.message.includes("No rows found")) {
          console.error("Error loading email preferences:", preferencesError)
          setMessage({
            type: "error",
            text: "Failed to load your email preferences. Please try again.",
          })
        }

        // If preferences exist, set the form values
        if (preferences) {
          setIsRandom(preferences.is_random)
          setSendTime(preferences.send_time)
          setSelectedHighlightId(preferences.highlight_id)
        }

        // Load highlights with book information
        const { data: highlightsData, error: highlightsError } = await safeQuery(() =>
          supabase
            .from("highlights")
            .select(`id, content, book_id, books:book_id(title)`)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        )

        if (highlightsError) {
          console.error("Error loading highlights:", highlightsError)
        } else if (highlightsData) {
          // Format highlights for the dropdown
          const formattedHighlights = highlightsData.map((h: any) => ({
            id: h.id,
            content: h.content,
            bookTitle: h.books?.title || "Unknown Book",
          }))
          setHighlights(formattedHighlights)
        }
      } catch (error) {
        console.error("Error in loadData:", error)
        setMessage({
          type: "error",
          text: "An unexpected error occurred. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  // Save email preferences
  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setMessage(null)

    try {
      const preferenceData = {
        user_id: user.id,
        is_random: isRandom,
        send_time: sendTime,
        highlight_id: isRandom ? null : selectedHighlightId,
        updated_at: new Date().toISOString(),
      }

      // Check if the user already has preferences
      const { data: existingPreference } = await supabase
        .from("email_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single()

      let result
      if (existingPreference) {
        // Update existing preference
        result = await supabase
          .from("email_preferences")
          .update(preferenceData)
          .eq("id", existingPreference.id)
          .select()
      } else {
        // Insert new preference
        result = await supabase.from("email_preferences").insert(preferenceData).select()
      }

      if (result.error) {
        throw result.error
      }

      setMessage({
        type: "success",
        text: "Email preferences saved successfully!",
      })
    } catch (error: any) {
      console.error("Error saving email preferences:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to save email preferences. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Filter highlights based on search input
  const filteredHighlights = highlights.filter(
    (highlight) =>
      highlight.content.toLowerCase().includes(searchValue.toLowerCase()) ||
      highlight.bookTitle.toLowerCase().includes(searchValue.toLowerCase()),
  )

  // Find the selected highlight
  const selectedHighlight = highlights.find((h) => h.id === selectedHighlightId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Configure how you receive highlight emails.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>Configure how you receive highlight emails.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert
            className={`border ${
              message.type === "success"
                ? "border-green-500/20 bg-green-500/10"
                : "border-destructive/20 bg-destructive/10"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-enabled">Daily Highlight Email</Label>
            <p className="text-sm text-muted-foreground">Receive a highlight from your collection each day.</p>
          </div>
          <Switch id="email-enabled" defaultChecked />
        </div>

        <div className="space-y-2">
          <Label>Highlight Selection</Label>
          <div className="flex items-center space-x-2">
            <Select value={isRandom ? "random" : "specific"} onValueChange={(value) => setIsRandom(value === "random")}>
              <SelectTrigger>
                <SelectValue placeholder="Select highlight type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random highlight</SelectItem>
                <SelectItem value="specific">Specific highlight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isRandom && (
          <div className="space-y-2">
            <Label>Choose Highlight</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={highlights.length === 0}
                >
                  {selectedHighlight ? (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{selectedHighlight.bookTitle}</span>
                      <span className="text-xs text-muted-foreground truncate w-full text-left">
                        {selectedHighlight.content.length > 60
                          ? `${selectedHighlight.content.substring(0, 60)}...`
                          : selectedHighlight.content}
                      </span>
                    </div>
                  ) : (
                    "Select a highlight"
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search highlights..." value={searchValue} onValueChange={setSearchValue} />
                  <CommandList>
                    <CommandEmpty>No highlights found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                      {filteredHighlights.map((highlight) => (
                        <CommandItem
                          key={highlight.id}
                          value={highlight.id}
                          onSelect={() => {
                            setSelectedHighlightId(highlight.id)
                            setOpen(false)
                          }}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{highlight.bookTitle}</span>
                            <span className="text-xs text-muted-foreground truncate w-full">
                              {highlight.content.length > 60
                                ? `${highlight.content.substring(0, 60)}...`
                                : highlight.content}
                            </span>
                          </div>
                          <CheckCircle2
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedHighlightId === highlight.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {highlights.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No highlights found. Add highlights to your collection first.
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="delivery-time">Delivery Time</Label>
          <Select value={sendTime} onValueChange={setSendTime}>
            <SelectTrigger id="delivery-time">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving || (!isRandom && !selectedHighlightId)}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
