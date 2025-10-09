"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Bell, Plug, Users, Shield, Palette, Globe } from "lucide-react"

const settingsCategories = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "users", label: "User Management", icon: Users },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language", icon: Globe },
]

export function SettingsNavigation() {
  const [activeCategory, setActiveCategory] = useState("general")

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <nav className="space-y-2">
          {settingsCategories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-700"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              <category.icon className="h-4 w-4 mr-3" />
              {category.label}
            </Button>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}
