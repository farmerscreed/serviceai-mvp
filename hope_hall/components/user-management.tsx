"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Edit, Trash2, Shield, Mail } from "lucide-react"

const users = [
  {
    id: "1",
    name: "Maria Rodriguez",
    email: "maria@hopehall.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2 hours ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "2",
    name: "Carlos Mendez",
    email: "carlos@hopehall.com",
    role: "Manager",
    status: "Active",
    lastLogin: "1 day ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "3",
    name: "Ana Gutierrez",
    email: "ana@hopehall.com",
    role: "Sales Rep",
    status: "Active",
    lastLogin: "3 hours ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "4",
    name: "Roberto Silva",
    email: "roberto@hopehall.com",
    role: "Sales Rep",
    status: "Inactive",
    lastLogin: "2 weeks ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

export function UserManagement() {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-600"
      case "Manager":
        return "bg-blue-600"
      case "Sales Rep":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    return status === "Active" ? "bg-green-600" : "bg-gray-600"
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">User Management</CardTitle>
          <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Last Login</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-slate-400 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(user.status)}`}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-400">{user.lastLogin}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
