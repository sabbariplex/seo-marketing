'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Save, CheckCircle, XCircle } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [connecting, setConnecting] = useState(false)
  const [propertyId, setPropertyId] = useState('')
  const [connected, setConnected] = useState(false)

  const handleGoogleConnect = async () => {
    setConnecting(true)
    try {
      await signIn('google', { callbackUrl: '/settings' })
    } catch (error) {
      console.error('Connection error:', error)
      setConnecting(false)
    }
  }

  const handleConnectAnalytics = async () => {
    if (!propertyId) {
      alert('Please enter a Google Analytics Property ID')
      return
    }

    try {
      const res = await fetch('/api/integrations/google-analytics/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })

      if (res.ok) {
        setConnected(true)
        alert('Google Analytics connected successfully!')
      } else {
        const error = await res.json()
        alert(`Failed to connect: ${error.error}`)
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert('Failed to connect Google Analytics')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your branding and connect your accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Account Connection</CardTitle>
          <CardDescription>
            Connect your Google account to access Google Analytics and Search Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-muted-foreground">Loading...</div>
          )}
          
          {status === 'unauthenticated' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in with Google to connect your analytics accounts
              </p>
              <Button onClick={handleGoogleConnect} disabled={connecting}>
                {connecting ? 'Connecting...' : 'Sign in with Google'}
              </Button>
            </div>
          )}

          {status === 'authenticated' && session && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Connected as {session.user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    You can now connect Google Analytics
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Google Analytics Property ID
                </label>
                <input
                  type="text"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Google Analytics account under Admin → Property Settings
                </p>
              </div>

              <Button 
                onClick={handleConnectAnalytics}
                disabled={!propertyId || connected}
              >
                {connected ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Connected
                  </>
                ) : (
                  'Connect Google Analytics'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/settings' })}
              >
                Sign Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>White-Label Branding</CardTitle>
          <CardDescription>
            Customize your dashboard and reports with your agency branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                <span className="text-muted-foreground text-sm">No logo</span>
              </div>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue="#3b82f6"
                  className="w-16 h-10 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  defaultValue="#3b82f6"
                  className="flex-1 px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue="#1e40af"
                  className="w-16 h-10 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  defaultValue="#1e40af"
                  className="flex-1 px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name</label>
            <input
              type="text"
              placeholder="Your Agency Name"
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            />
          </div>

          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Branding Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other API Integrations</CardTitle>
          <CardDescription>
            Connect additional SEO tools and analytics platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Google Search Console</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Ahrefs</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">SEMrush</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Moz</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
