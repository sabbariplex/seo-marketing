export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface ReportTemplate {
  id: string
  name: string
  type: ReportType
  sections: ReportSection[]
}

export interface ReportSection {
  id: string
  title: string
  type: 'kpi' | 'chart' | 'table' | 'text'
  config: Record<string, any>
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  recipients: string[]
}
