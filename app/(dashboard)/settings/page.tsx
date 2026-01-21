'use client'

import { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Save, CheckCircle, XCircle } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [propertyId, setPropertyId] = useState('')
  const [connected, setConnected] = useState(false)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)
  
  // Branding state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#1e40af')
  const [companyName, setCompanyName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Refresh session after OAuth callback
  useEffect(() => {
    // Check if we just returned from OAuth (check URL params and referrer)
    const urlParams = new URLSearchParams(window.location.search)
    const hasAuthParams = urlParams.has('callbackUrl') || 
                        urlParams.has('error') ||
                        window.location.hash.includes('access_token')
    
    // Check referrer for OAuth flow
    const referrer = document.referrer
    const isFromOAuth = referrer.includes('accounts.google.com') || 
                       referrer.includes('oauth2.googleapis.com') ||
                       referrer.includes('/api/auth/')
    
    if ((hasAuthParams || isFromOAuth) && !hasCheckedSession) {
      setHasCheckedSession(true)
      
      // Refresh session multiple times with delays
      const refreshAttempts = [500, 1500, 3000]
      const timeouts: NodeJS.Timeout[] = []
      
      refreshAttempts.forEach(delay => {
        const timeout = setTimeout(async () => {
          try {
            const result = await update()
            // Check if we're now authenticated after update
            if (result) {
              // Clean URL if needed
              if (hasAuthParams) {
                router.replace('/settings')
              }
            }
          } catch (error) {
            console.error('Error refreshing session:', error)
          }
        }, delay)
        timeouts.push(timeout)
      })
      
      return () => {
        timeouts.forEach(clearTimeout)
      }
    }
  }, [update, hasCheckedSession, router])

  // Listen for window focus (user might return from OAuth popup)
  useEffect(() => {
    const handleFocus = async () => {
      if (status === 'loading' || status === 'unauthenticated') {
        await update()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [update, status])

  // Poll session when loading
  useEffect(() => {
    if (status === 'loading' && !hasCheckedSession) {
      const pollInterval = setInterval(async () => {
        await update()
      }, 2000)
      
      const timeout = setTimeout(() => {
        clearInterval(pollInterval)
        setHasCheckedSession(true)
      }, 10000) // Stop polling after 10 seconds
      
      return () => {
        clearInterval(pollInterval)
        clearTimeout(timeout)
      }
    }
  }, [status, update, hasCheckedSession])

  // Monitor session status
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Reset connecting state when authenticated
      setConnecting(false)
    }
    
    if (status === 'unauthenticated') {
      setConnecting(false)
    }
  }, [status, session])

  // Load branding settings
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/branding', {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          // Check if response is an error object
          if (data && !data.error) {
            if (data.logoUrl) setLogoUrl(data.logoUrl)
            if (data.primaryColor) setPrimaryColor(data.primaryColor)
            if (data.secondaryColor) setSecondaryColor(data.secondaryColor)
            if (data.companyName) setCompanyName(data.companyName)
          }
        })
        .catch(err => console.error('Failed to load branding:', err))
    }
  }, [status])

  const handleGoogleConnect = async () => {
    setConnecting(true)
    setHasCheckedSession(false) // Reset to allow session check after redirect
    try {
      await signIn('google', { 
        callbackUrl: '/settings',
        redirect: true 
      })
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
        credentials: 'include',
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
                <div className="flex-1">
                  <p className="font-medium">Connected as {session.user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    You can now connect Google Analytics
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access Token: {(session as any).accessToken ? '✓ Available' : '✗ Missing'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await update()
                    window.location.reload()
                  }}
                >
                  Refresh Session
                </Button>
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
              <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-muted-foreground text-sm">No logo</span>
                )}
              </div>
              <Button 
                variant="outline"
                disabled={uploading}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      setUploading(true)
                      try {
                        const formData = new FormData()
                        formData.append('file', file)
                        
                        const res = await fetch('/api/branding/upload', {
                          method: 'POST',
                          credentials: 'include',
                          body: formData,
                        })
                        
                        if (res.ok) {
                          const data = await res.json()
                          setLogoUrl(data.logoUrl)
                          alert('Logo uploaded successfully!')
                        } else {
                          const error = await res.json()
                          alert(`Failed to upload logo: ${error.error}`)
                        }
                      } catch (error) {
                        alert('Failed to upload logo')
                      } finally {
                        setUploading(false)
                      }
                    }
                  }
                  input.click()
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-10 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Agency Name"
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            />
          </div>

          <Button
            onClick={async () => {
              setSaving(true)
              try {
                const res = await fetch('/api/branding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    logoUrl,
                    primaryColor,
                    secondaryColor,
                    companyName,
                  }),
                })
                
                if (res.ok) {
                  const data = await res.json()
                  alert('Branding settings saved successfully!')
                } else {
                  const error = await res.json()
                  alert(`Failed to save settings: ${error.error}`)
                }
              } catch (error) {
                alert('Failed to save branding settings')
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Branding Settings'}
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (session) {
                  alert('Google Search Console connection coming soon!')
                } else {
                  alert('Please sign in with Google first')
                }
              }}
            >
              Connect
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Ahrefs</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('Ahrefs integration coming soon!')}
            >
              Connect
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">SEMrush</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('SEMrush integration coming soon!')}
            >
              Connect
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Moz</h3>
              <p className="text-sm text-muted-foreground">Not connected</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('Moz integration coming soon!')}
            >
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
