import { ReportTemplate } from '@/types/reports'

export const defaultReportTemplates: ReportTemplate[] = [
  {
    id: 'daily',
    name: 'Daily SEO Report',
    type: 'daily',
    sections: [
      { id: '1', title: 'Executive Summary', type: 'text', config: {} },
      { id: '2', title: 'Key Metrics', type: 'kpi', config: { metrics: ['traffic', 'rankings', 'conversions'] } },
      { id: '3', title: 'Traffic Overview', type: 'chart', config: { chartType: 'line' } },
      { id: '4', title: 'Top Keywords', type: 'table', config: { limit: 10 } }
    ]
  },
  {
    id: 'weekly',
    name: 'Weekly SEO Report',
    type: 'weekly',
    sections: [
      { id: '1', title: 'Executive Summary', type: 'text', config: {} },
      { id: '2', title: 'Performance Overview', type: 'kpi', config: { metrics: ['traffic', 'rankings', 'backlinks', 'conversions'] } },
      { id: '3', title: 'Traffic Trends', type: 'chart', config: { chartType: 'area' } },
      { id: '4', title: 'Keyword Rankings', type: 'table', config: { limit: 20 } },
      { id: '5', title: 'Backlink Analysis', type: 'chart', config: { chartType: 'bar' } },
      { id: '6', title: 'Page Speed Metrics', type: 'kpi', config: { metrics: ['lcp', 'fid', 'cls'] } }
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly SEO Report',
    type: 'monthly',
    sections: [
      { id: '1', title: 'Executive Summary', type: 'text', config: {} },
      { id: '2', title: 'Performance Overview', type: 'kpi', config: { metrics: ['traffic', 'rankings', 'backlinks', 'conversions', 'pagespeed'] } },
      { id: '3', title: 'Traffic Analysis', type: 'chart', config: { chartType: 'line' } },
      { id: '4', title: 'Keyword Performance', type: 'table', config: { limit: 50 } },
      { id: '5', title: 'Backlink Growth', type: 'chart', config: { chartType: 'area' } },
      { id: '6', title: 'Top Performing Pages', type: 'table', config: { limit: 20 } },
      { id: '7', title: 'Page Speed Analysis', type: 'chart', config: { chartType: 'bar' } },
      { id: '8', title: 'Recommendations', type: 'text', config: {} }
    ]
  }
]
