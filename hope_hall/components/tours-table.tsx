import { useTours } from "@/hooks/use-tours"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil } from "lucide-react"

export default function ToursTable() {
  const { tours, deleteTour, loading } = useTours()

  if (loading) return <p className="text-slate-400">Loading tours…</p>

  if (tours.length === 0) return <p className="text-slate-400">No tours scheduled.</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Guests</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tours.map((tour) => (
          <TableRow key={tour.id} className="hover:bg-slate-800/50">
            <TableCell className="text-slate-200">{format(new Date(tour.tour_date + 'T00:00:00'), "MMM dd, yyyy")}</TableCell>
            <TableCell className="text-slate-200">{tour.tour_time}</TableCell>
            <TableCell className="text-slate-200">{tour.leads?.lead_name || "Unknown"}</TableCell>
            <TableCell className="text-slate-200">{tour.leads?.event_type || tour.event_type || "-"}</TableCell>
            <TableCell className="text-slate-200">{tour.leads?.guest_count || tour.guest_count || 0}</TableCell>
            <TableCell><Badge>{tour.tour_status}</Badge></TableCell>
            <TableCell className="text-right space-x-2">
              <Button 
                size="icon" 
                variant="outline" 
                className="text-slate-300 hover:text-white border-slate-600 hover:border-slate-500"
                onClick={() => alert('Edit functionality will be added to the calendar view')}
              > 
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="text-red-400 hover:text-red-300 border-red-600 hover:border-red-500"
                onClick={async () => {
                  if (confirm("Delete this tour?")) {
                    await deleteTour(tour.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 