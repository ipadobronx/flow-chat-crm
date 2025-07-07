import { useState } from "react";
import { MoreHorizontal, Phone, Mail, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const leads = [
  {
    id: 1,
    name: "Sarah Johnson",
    company: "TechStart Inc.",
    email: "sarah@techstart.com",
    phone: "+1 (555) 123-4567",
    stage: "Proposal",
    value: "$25,000",
    lastContact: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Michael Chen",
    company: "Digital Solutions",
    email: "m.chen@digsol.com",
    phone: "+1 (555) 987-6543",
    stage: "Negotiation",
    value: "$45,000",
    lastContact: "1 day ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    company: "Growth Co.",
    email: "emily@growthco.com",
    phone: "+1 (555) 456-7890",
    stage: "Qualified",
    value: "$18,500",
    lastContact: "3 hours ago",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 4,
    name: "David Park",
    company: "Innovation Labs",
    email: "david@innovlabs.com",
    phone: "+1 (555) 321-0987",
    stage: "Contacted",
    value: "$32,000",
    lastContact: "5 hours ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  }
];

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Contacted": return "secondary";
    case "Qualified": return "default";
    case "Proposal": return "outline";
    case "Negotiation": return "destructive";
    default: return "secondary";
  }
};

export function LeadsTable() {
  const [selectedLead, setSelectedLead] = useState<any>(null);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Active Leads</CardTitle>
        <CardDescription>
          Manage your sales pipeline and track lead progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedLead(lead)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={lead.avatar} />
                      <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{lead.company}</TableCell>
                <TableCell>
                  <Badge variant={getStageColor(lead.stage)}>{lead.stage}</Badge>
                </TableCell>
                <TableCell className="font-semibold text-success">{lead.value}</TableCell>
                <TableCell className="text-muted-foreground">{lead.lastContact}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        WhatsApp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}