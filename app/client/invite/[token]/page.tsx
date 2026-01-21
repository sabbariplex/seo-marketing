'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function ClientInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [inviteData, setInviteData] = useState<{ email: string; clientId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetch(`/api/clients/invite?token=${token}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) {
            console.error('API error:', res.status)
            throw new Error(`API error: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          if (data.valid) {
            setValid(true)
            setInviteData({ email: data.email, clientId: data.clientId })
          } else {
            setError(data.error || 'Invalid invite link')
          }
          setLoading(false)
        })
        .catch(err => {
          console.error('Error verifying invite:', err)
          setError('Failed to verify invite')
          setLoading(false)
        })
    }
  }, [token])

  const handleAcceptInvite = async () => {
    // Sign in with Google, then associate with client
    await signIn('google', {
      callbackUrl: `/client/dashboard?invite=${token}`
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verifying invite...</span>
        </div>
      </div>
    )
  }

  if (error || !valid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              {error || 'This invite link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Client Portal Access</CardTitle>
          <CardDescription>
            You've been invited to access your SEO dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteData && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Invited email:</p>
              <p className="font-medium">{inviteData.email}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Sign in with Google to access your personalized dashboard and view your SEO performance metrics.
          </p>
          <Button onClick={handleAcceptInvite} className="w-full">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
