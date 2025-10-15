'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/lib/organizations/organization-context'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare, 
  Globe, 
  FileText,
  TestTube,
  Copy,
  Check
} from 'lucide-react'

interface SMSTemplate {
  id: string
  key: string
  language: 'en' | 'es'
  content: string
  variables: string[]
  category: 'appointment' | 'emergency' | 'reminder' | 'confirmation' | 'follow_up'
  is_active: boolean
  created_at: string
  updated_at: string
}

const templateCategories = [
  { value: 'appointment', label: 'Appointment', color: 'bg-blue-100 text-blue-800' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' },
  { value: 'reminder', label: 'Reminder', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmation', label: 'Confirmation', color: 'bg-green-100 text-green-800' },
  { value: 'follow_up', label: 'Follow-up', color: 'bg-purple-100 text-purple-800' }
]

export default function SMSTemplatesPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<SMSTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>('en')
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    key: '',
    language: 'en' as 'en' | 'es',
    content: '',
    variables: [] as string[],
    category: 'appointment' as string,
    is_active: true
  })

  const [testData, setTestData] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    if (currentOrganization) {
      loadTemplates()
    }
  }, [currentOrganization, selectedLanguage])

  const loadTemplates = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const response = await fetch(`/api/sms/templates?organizationId=${currentOrganization.organization_id}&language=${selectedLanguage}`)
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load templates',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!currentOrganization) return

    try {
      const response = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: currentOrganization.organization_id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Template created successfully'
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadTemplates()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create template',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateTemplate = async () => {
    if (!currentOrganization || !selectedTemplate) return

    try {
      const response = await fetch('/api/sms/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate.id,
          ...formData,
          organizationId: currentOrganization.organization_id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Template updated successfully'
        })
        setIsEditDialogOpen(false)
        setSelectedTemplate(null)
        resetForm()
        loadTemplates()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update template',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      })
    }
  }

  const handleTestTemplate = async () => {
    if (!currentOrganization || !selectedTemplate) return

    try {
      const response = await fetch('/api/sms/test-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey: selectedTemplate.key,
          language: selectedTemplate.language,
          testData,
          organizationId: currentOrganization.organization_id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setTestResult(data.formattedMessage)
        toast({
          title: 'Success',
          description: 'Template test completed'
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to test template',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test template',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      key: '',
      language: 'en',
      content: '',
      variables: [],
      category: 'appointment',
      is_active: true
    })
    setTestData({})
    setTestResult('')
  }

  const openEditDialog = (template: SMSTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      key: template.key,
      language: template.language,
      content: template.content,
      variables: template.variables,
      category: template.category,
      is_active: template.is_active
    })
    setIsEditDialogOpen(true)
  }

  const openTestDialog = (template: SMSTemplate) => {
    setSelectedTemplate(template)
    // Initialize test data with sample values
    const sampleData: Record<string, string> = {}
    template.variables.forEach(variable => {
      sampleData[variable] = `Sample ${variable.replace(/_/g, ' ')}`
    })
    setTestData(sampleData)
    setTestResult('')
    setIsTestDialogOpen(true)
  }

  const copyToClipboard = async (text: string, templateKey: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTemplate(templateKey)
      setTimeout(() => setCopiedTemplate(null), 2000)
      toast({
        title: 'Copied',
        description: 'Template content copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryInfo = (category: string) => {
    return templateCategories.find(cat => cat.value === category) || templateCategories[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Templates</h1>
          <p className="text-gray-600">Manage your SMS message templates for different scenarios</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create SMS Template</DialogTitle>
              <DialogDescription>
                Create a new SMS template for your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="key">Template Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="e.g., appointment_confirmation"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value: 'en' | 'es') => setFormData({ ...formData, language: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Template Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your SMS template content. Use {{variable_name}} for dynamic content."
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use variables like {`{{customer_name}}`}, {`{{service_type}}`}, {`{{date}}`}, etc.
                </p>
              </div>
              <div>
                <Label htmlFor="variables">Variables (comma-separated)</Label>
                <Input
                  id="variables"
                  value={formData.variables.join(', ')}
                  onChange={(e) => setFormData({ ...formData, variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) })}
                  placeholder="customer_name, service_type, date, time"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {templateCategories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLanguage} onValueChange={(value: 'en' | 'es') => setSelectedLanguage(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const categoryInfo = getCategoryInfo(template.category)
          return (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.key}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <Badge className={categoryInfo.color}>
                        {categoryInfo.label}
                      </Badge>
                      <Badge variant="outline">
                        {template.language === 'en' ? 'English' : 'Spanish'}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(template.content, template.key)}
                    >
                      {copiedTemplate === template.key ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTestDialog(template)}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {template.content}
                    </p>
                  </div>
                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first SMS template'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
            <DialogDescription>
              Update the SMS template content and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-key">Template Key</Label>
                <Input
                  id="edit-key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-language">Language</Label>
              <Select value={formData.language} onValueChange={(value: 'en' | 'es') => setFormData({ ...formData, language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-content">Template Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-variables">Variables (comma-separated)</Label>
              <Input
                id="edit-variables"
                value={formData.variables.join(', ')}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTemplate}>
                Update Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test SMS Template</DialogTitle>
            <DialogDescription>
              Test how your template will look with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate && (
              <>
                <div>
                  <Label>Template: {selectedTemplate.key}</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.content}</p>
                </div>
                <div>
                  <Label>Test Data</Label>
                  <div className="space-y-2 mt-2">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable} className="flex items-center space-x-2">
                        <Label htmlFor={variable} className="w-32 text-sm">
                          {variable}:
                        </Label>
                        <Input
                          id={variable}
                          value={testData[variable] || ''}
                          onChange={(e) => setTestData({ ...testData, [variable]: e.target.value })}
                          placeholder={`Enter ${variable}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={handleTestTemplate}>
                    Test Template
                  </Button>
                </div>
                {testResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <Label>Formatted Message:</Label>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{testResult}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
