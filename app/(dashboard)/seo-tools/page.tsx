'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Link2, Gauge, FileSearch } from 'lucide-react'

const seoTools = [
  {
    id: 'audit',
    title: 'SEO Audit',
    description: 'Comprehensive website SEO analysis and recommendations',
    icon: FileSearch
  },
  {
    id: 'keyword-research',
    title: 'Keyword Research',
    description: 'Discover high-value keywords and analyze competition',
    icon: Search
  },
  {
    id: 'backlink-analyzer',
    title: 'Backlink Analyzer',
    description: 'Analyze backlink profile and identify link opportunities',
    icon: Link2
  },
  {
    id: 'traffic-analysis',
    title: 'Traffic Analysis',
    description: 'Deep dive into traffic sources and user behavior',
    icon: Gauge
  }
]

export default function SEOToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO Tools</h1>
        <p className="text-muted-foreground mt-1">
          Advanced SEO analysis and research tools
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {seoTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Card key={tool.id} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{tool.description}</CardDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 w-full"
                  disabled
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
