"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useConversionFunnel } from "@/hooks/use-conversion-funnel"
import { Skeleton } from "@/components/ui/skeleton"

const stageColors = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-red-600",
  "bg-green-600",
];

export function ConversionFunnel() {
  const { funnelData, loading, error } = useConversionFunnel();

  if (loading) {
    return <ConversionFunnelSkeleton />;
  }

  if (error) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading funnel data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Conversion Funnel</CardTitle>
        <p className="text-slate-400">Lead journey from initial contact to booking</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${stageColors[index % stageColors.length]}`} />
                  <span className="text-white font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm">{stage.conversion}% conversion</span>
                  <span className="text-white font-bold">{stage.value}</span>
                </div>
              </div>
              <div className="ml-7">
                <Progress value={stage.totalConversion} className="h-2" />
              </div>
              {index < funnelData.length - 1 && stage.value > 0 && funnelData[index + 1].value > 0 && (
                <div className="ml-9 text-xs text-slate-500">
                  {funnelData[index + 1].value} of {stage.value} moved to next stage ({Math.round((funnelData[index + 1].value / stage.value) * 100)}%)
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const ConversionFunnelSkeleton = () => (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Conversion Funnel</CardTitle>
        <p className="text-slate-400">Lead journey from initial contact to booking</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="w-4 h-4 rounded-full" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-6 w-10" />
                        </div>
                    </div>
                    <div className="ml-7">
                        <Skeleton className="h-2 w-full" />
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
)
