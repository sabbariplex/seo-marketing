'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Globe, X, UserPlus, Copy, Check } from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
  website?: string
  createdAt: string
  updatedAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: ''
  })
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({})
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch clients:', err)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const newClient = await res.json()
        setClients([...clients, newClient])
        setFormData({ name: '', email: '', website: '' })
        setShowAddForm(false)
      }
    } catch (err) {
      console.error('Failed to create client:', err)
    }
  }

  const handleInviteClient = async (clientId: string, email: string) => {
    try {
      const res = await fetch('/api/clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, email })
      })
      if (res.ok) {
        const data = await res.json()
        setInviteLinks({ ...inviteLinks, [clientId]: data.inviteLink })
      }
    } catch (err) {
      console.error('Failed to create invite:', err)
      alert('Failed to create invite link')
    }
  }

  const copyInviteLink = (link: string, clientId: string) => {
    navigator.clipboard.writeText(link)
    setCopiedToken(clientId)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading clients...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client accounts and projects
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add New Client</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Client</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle>{client.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              )}
              <div className="pt-4 space-y-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(`/client/dashboard?clientId=${client.id}`, '_blank')}
                  >
                    View Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push(`/settings?connect=${client.id}`)}
                  >
                    Connect Account
                  </Button>
                </div>
                {client.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleInviteClient(client.id, client.email!)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {inviteLinks[client.id] ? 'Invite Link Generated' : 'Generate Client Access'}
                  </Button>
                )}
                {inviteLinks[client.id] && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <input
                      type="text"
                      value={inviteLinks[client.id]}
                      readOnly
                      className="flex-1 text-xs bg-background px-2 py-1 rounded border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(inviteLinks[client.id], client.id)}
                    >
                      {copiedToken === client.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
