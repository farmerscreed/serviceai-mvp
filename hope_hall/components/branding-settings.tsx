"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  Palette, Upload, Globe, Mail, Save, Loader2, Eye, EyeOff,
  CheckCircle, AlertCircle, ExternalLink, Trash2, Plus
} from "lucide-react"
import { useBrandingContext } from "@/lib/branding-context"
import { CustomDomainManager } from "@/components/custom-domain-manager"
import { Skeleton } from "@/components/ui/skeleton"

interface BrandingData {
  id?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  custom_domain?: string
  custom_domain_verified?: boolean
  email_template_settings?: {
    header_color?: string
    footer_color?: string
    button_color?: string
    font_family?: string
  }
  email_signature?: string
  social_media_links?: {
    facebook?: string
    instagram?: string
    twitter?: string
    website?: string
  }
  custom_css?: string
  favicon_url?: string
}

export function BrandingSettings() {
  const { branding, loading, updateBranding, uploadLogo } = useBrandingContext()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [showCustomCSS, setShowCustomCSS] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    primary_color: "#1e40af",
    secondary_color: "#f59e0b",
    accent_color: "#dc2626",
    custom_domain: "",
    email_signature: "",
    custom_css: "",
    social_facebook: "",
    social_instagram: "",
    social_twitter: "",
    social_website: ""
  })

  // Load branding data
  useEffect(() => {
    if (branding) {
      setFormData({
        primary_color: branding.primary_color || "#1e40af",
        secondary_color: branding.secondary_color || "#f59e0b",
        accent_color: branding.accent_color || "#dc2626",
        custom_domain: branding.custom_domain || "",
        email_signature: branding.email_signature || "",
        custom_css: branding.custom_css || "",
        social_facebook: branding.social_media_links?.facebook || "",
        social_instagram: branding.social_media_links?.instagram || "",
        social_twitter: branding.social_media_links?.twitter || "",
        social_website: branding.social_media_links?.website || ""
      })
      if (branding.logo_url) {
        setLogoPreview(branding.logo_url)
      }
    }
  }, [branding])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const brandingData = {
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        email_signature: formData.email_signature,
        custom_css: formData.custom_css,
        email_template_settings: {
          header_color: formData.primary_color,
          footer_color: "#374151",
          button_color: formData.secondary_color,
          font_family: "Arial, sans-serif"
        },
        social_media_links: {
          facebook: formData.social_facebook,
          instagram: formData.social_instagram,
          twitter: formData.social_twitter,
          website: formData.social_website
        }
      }

      if (logoFile) {
        await uploadLogo(logoFile)
      } else {
        await updateBranding(brandingData)
      }

      toast({
        title: "Branding settings saved successfully!",
        description: "Your branding settings have been updated.",
      })
    } catch (error) {
      console.error("Error saving branding:", error)
      toast({
        title: "Failed to save branding settings",
        description: "There was an error saving your branding settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }



  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Branding Settings</CardTitle>
          <CardDescription className="text-slate-400">
            Customize your organization's visual identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Branding Settings
        </CardTitle>
        <CardDescription className="text-slate-400">
          Customize your organization's visual identity, colors, and branding elements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4">
          <Label className="text-white">Organization Logo</Label>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={logoPreview} />
              <AvatarFallback className="bg-slate-700 text-white">
                {formData.primary_color ? 'LOGO' : 'HH'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="text-slate-300"
              />
              <p className="text-sm text-slate-400 mt-1">
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Color Scheme */}
        <div className="space-y-4">
          <Label className="text-white">Color Scheme</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-12 h-10 p-1 border-slate-600"
                />
                <Input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-12 h-10 p-1 border-slate-600"
                />
                <Input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  placeholder="#f59e0b"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Accent Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  className="w-12 h-10 p-1 border-slate-600"
                />
                <Input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  placeholder="#dc2626"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Custom Domain Manager */}
        <CustomDomainManager />

        <Separator className="bg-slate-700" />

        {/* Social Media Links */}
        <div className="space-y-4">
          <Label className="text-white">Social Media Links</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Facebook</Label>
              <Input
                type="url"
                value={formData.social_facebook}
                onChange={(e) => handleInputChange('social_facebook', e.target.value)}
                placeholder="https://facebook.com/yourvenue"
                className="text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Instagram</Label>
              <Input
                type="url"
                value={formData.social_instagram}
                onChange={(e) => handleInputChange('social_instagram', e.target.value)}
                placeholder="https://instagram.com/yourvenue"
                className="text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Twitter</Label>
              <Input
                type="url"
                value={formData.social_twitter}
                onChange={(e) => handleInputChange('social_twitter', e.target.value)}
                placeholder="https://twitter.com/yourvenue"
                className="text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Website</Label>
              <Input
                type="url"
                value={formData.social_website}
                onChange={(e) => handleInputChange('social_website', e.target.value)}
                placeholder="https://yourvenue.com"
                className="text-slate-300"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Email Signature */}
        <div className="space-y-4">
          <Label className="text-white">Email Signature</Label>
          <Textarea
            value={formData.email_signature}
            onChange={(e) => handleInputChange('email_signature', e.target.value)}
            placeholder="Best regards,&#10;The Hope Hall Team&#10;events@thehopehall.com"
            className="text-slate-300 min-h-[100px]"
          />
          <p className="text-sm text-slate-400">
            This signature will be automatically added to all outgoing emails
          </p>
        </div>

        <Separator className="bg-slate-700" />

        {/* Custom CSS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white">Custom CSS</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomCSS(!showCustomCSS)}
              className="text-slate-400 hover:text-white"
            >
              {showCustomCSS ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showCustomCSS ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
          {showCustomCSS && (
            <Textarea
              value={formData.custom_css}
              onChange={(e) => handleInputChange('custom_css', e.target.value)}
              placeholder="/* Custom CSS styles */&#10;.custom-header {&#10;  background-color: var(--primary-color);&#10;}"
              className="text-slate-300 min-h-[150px] font-mono text-sm"
            />
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Branding
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
