import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const stages = [
  { name: "New Leads", count: 12, color: "bg-blue-500" },
  { name: "Contacted", count: 8, color: "bg-yellow-500" },
  { name: "Qualified", count: 5, color: "bg-orange-500" },
  { name: "Proposal", count: 3, color: "bg-purple-500" },
  { name: "Closed Won", count: 2, color: "bg-green-500" }
];

const leads = {
  "New Leads": [
    { id: 1, name: "John Doe", company: "Tech Corp", value: "$15,000" },
    { id: 2, name: "Jane Smith", company: "StartupX", value: "$8,500" }
  ],
  "Contacted": [
    { id: 3, name: "Bob Johnson", company: "BigCo", value: "$25,000" },
    { id: 4, name: "Alice Brown", company: "Growth Ltd", value: "$12,000" }
  ],
  "Qualified": [
    { id: 5, name: "Charlie Wilson", company: "Enterprise Inc", value: "$45,000" }
  ],
  "Proposal": [
    { id: 6, name: "Diana Davis", company: "Scale Co", value: "$32,000" }
  ],
  "Closed Won": [
    { id: 7, name: "Eva Martinez", company: "Success Corp", value: "$18,000" }
  ]
};

export default function Pipeline() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Kanban board for lead management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stages.map((stage) => (
            <Card key={stage.name} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                  <Badge variant="secondary">{stage.count}</Badge>
                </div>
                <div className={`w-full h-1 rounded-full ${stage.color}`} />
              </CardHeader>
              <CardContent className="space-y-3">
                {leads[stage.name as keyof typeof leads]?.map((lead) => (
                  <div key={lead.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-grab">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.name}`} />
                        <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                        <p className="text-sm font-semibold text-success mt-1">{lead.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}