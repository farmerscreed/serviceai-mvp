"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Filter, ChevronDown, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FilterProps {
  onFiltersChange?: (filters: any) => void
  className?: string
}

export function LeadsFilters({ onFiltersChange, className }: FilterProps) {
  const [leadScore, setLeadScore] = useState([0, 100])
  const [categories, setCategories] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const categoryOptions = ["HOT", "WARM", "COOL"]
  const sourceOptions = ["VAPI Phone Call", "Phone-VAPI", "Facebook", "Google", "Referral", "Website"]
  const languageOptions = ["English", "Spanish", "Bilingual"]

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Emit filter changes automatically
  useEffect(() => {
    const filters = {
      scoreRange: leadScore,
      categories,
      sources,
      languages,
      dateRange: {
        from: dateRange.from ? new Date(dateRange.from) : undefined,
        to: dateRange.to ? new Date(dateRange.to) : undefined
      }
    }
    onFiltersChange?.(filters)
  }, [leadScore, categories, sources, languages, dateRange, onFiltersChange])

  const clearAllFilters = () => {
    setLeadScore([0, 100])
    setCategories([])
    setSources([])
    setLanguages([])
    setDateRange({ from: "", to: "" })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (leadScore[0] > 0 || leadScore[1] < 100) count++
    if (categories.length > 0) count++
    if (sources.length > 0) count++
    if (languages.length > 0) count++
    if (dateRange.from || dateRange.to) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Lead Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300 text-sm font-medium">Lead Score Range</Label>
          {(leadScore[0] > 0 || leadScore[1] < 100) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeadScore([0, 100])}
              className="h-6 px-2 text-xs text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="px-2">
          <Slider 
            value={leadScore} 
            onValueChange={setLeadScore} 
            max={100} 
            min={0} 
            step={5} 
            className="w-full" 
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{leadScore[0]}</span>
          <span>{leadScore[1]}</span>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300 text-sm font-medium">Category</Label>
          {categories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategories([])}
              className="h-6 px-2 text-xs text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {categoryOptions.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={categories.includes(category)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setCategories([...categories, category])
                  } else {
                    setCategories(categories.filter((c) => c !== category))
                  }
                }}
                className="border-white data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
              />
              <Label htmlFor={category} className="text-sm text-slate-300 cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.map(category => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300 text-sm font-medium">Lead Source</Label>
          {sources.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSources([])}
              className="h-6 px-2 text-xs text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {sourceOptions.map((source) => (
            <div key={source} className="flex items-center space-x-2">
              <Checkbox
                id={source}
                checked={sources.includes(source)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSources([...sources, source])
                  } else {
                    setSources(sources.filter((s) => s !== source))
                  }
                }}
                className="border-white data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
              />
              <Label htmlFor={source} className="text-sm text-slate-300 cursor-pointer">
                {source}
              </Label>
            </div>
          ))}
        </div>
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sources.map(source => (
              <Badge key={source} variant="secondary" className="text-xs">
                {source}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Languages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300 text-sm font-medium">Language</Label>
          {languages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguages([])}
              className="h-6 px-2 text-xs text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {languageOptions.map((language) => (
            <div key={language} className="flex items-center space-x-2">
              <Checkbox
                id={language}
                checked={languages.includes(language)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setLanguages([...languages, language])
                  } else {
                    setLanguages(languages.filter((l) => l !== language))
                  }
                }}
                className="border-white data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
              />
              <Label htmlFor={language} className="text-sm text-slate-300 cursor-pointer">
                {language}
              </Label>
            </div>
          ))}
        </div>
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {languages.map(language => (
              <Badge key={language} variant="secondary" className="text-xs">
                {language}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300 text-sm font-medium">Date Range</Label>
          {(dateRange.from || dateRange.to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: "", to: "" })}
              className="h-6 px-2 text-xs text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-slate-400">From</Label>
            <Input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white text-sm" 
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400">To</Label>
            <Input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white text-sm" 
            />
          </div>
        </div>
      </div>

      {/* Clear All Button */}
      {activeFilterCount > 0 && (
        <Button 
          variant="outline" 
          onClick={clearAllFilters}
          className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full bg-slate-900 border-slate-800 text-white justify-between"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="bg-slate-900 border-slate-800 mt-2">
            <CardContent className="p-4">
              <FilterContent />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <Card className={`bg-slate-900 border-slate-800 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  )
}
