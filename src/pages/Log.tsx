import { useState } from 'react'
import { Link } from 'wouter'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MealLog } from '@/components/MealLog'
import { Charts } from '@/components/Charts'
import { getDailySummary, getWeeklySummaries } from '@/lib/storage'

export function Log() {
  const [view, setView] = useState<'today' | 'week' | 'month'>('today')

  const today = new Date()
  const dailySummary = getDailySummary(today)
  const weeklySummaries = getWeeklySummaries(today)

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Meal Log</h1>
              <p className="text-muted-foreground mt-1">
                Track your daily glycemic load and calories
              </p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Today
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total GL</div>
                <div className="text-3xl font-bold mt-1">
                  {dailySummary.totalGL.toFixed(1)}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Calories</div>
                <div className="text-3xl font-bold mt-1">
                  {dailySummary.totalCalories}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Avg GI</div>
                <div className="text-3xl font-bold mt-1">
                  {dailySummary.averageGI.toFixed(0)}
                </div>
              </Card>
            </div>
            <MealLog meals={dailySummary.meals} />
          </TabsContent>

          <TabsContent value="week" className="mt-6">
            <Charts data={weeklySummaries} type="week" />
          </TabsContent>

          <TabsContent value="month" className="mt-6">
            <Charts data={weeklySummaries} type="month" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
