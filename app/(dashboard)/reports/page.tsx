'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Mail, Plus } from 'lucide-react'

const mockReports = [
  {
    id: '1',
    name: 'Weekly SEO Report - Acme Corp',
    type: 'weekly',
    client: 'Acme Corporation',
    lastGenerated: '2024-01-10',
    nextScheduled: '2024-01-17'
  },
  {
    id: '2',
    name: 'Monthly Performance Report',
    type: 'monthly',
    client: 'TechStart Inc',
    lastGenerated: '2024-01-01',
    nextScheduled: '2024-02-01'
  },
  {
    id: '3',
    name: 'Daily Traffic Report',
    type: 'daily',
    client: 'Digital Solutions LLC',
    lastGenerated: '2024-01-14',
    nextScheduled: '2024-01-15'
  }
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Create, schedule, and manage automated SEO reports
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                  <CardDescription className="mt-1">{report.client}</CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{report.type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Generated:</span>
                <span className="font-medium">{report.lastGenerated}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next Scheduled:</span>
                <span className="font-medium">{report.nextScheduled}</span>
              </div>
              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-1" />
                  Send
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
