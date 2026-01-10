import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, ShoppingBag, Star, MoreVertical } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  joinDate: string;
}

const customers: Customer[] = [
  { id: "1", name: "Priya Sharma", phone: "+91 98765 43210", email: "priya.s@email.com", totalOrders: 45, totalSpent: 34500, lastOrder: "Today", loyaltyTier: "gold", joinDate: "Jan 2024" },
  { id: "2", name: "Amit Kumar", phone: "+91 87654 32109", email: "amit.k@email.com", totalOrders: 78, totalSpent: 56780, lastOrder: "Yesterday", loyaltyTier: "platinum", joinDate: "Oct 2023" },
  { id: "3", name: "Sunita Devi", phone: "+91 76543 21098", email: "sunita.d@email.com", totalOrders: 23, totalSpent: 15600, lastOrder: "3 days ago", loyaltyTier: "silver", joinDate: "Mar 2024" },
  { id: "4", name: "Ravi Patel", phone: "+91 65432 10987", email: "ravi.p@email.com", totalOrders: 12, totalSpent: 8900, lastOrder: "1 week ago", loyaltyTier: "bronze", joinDate: "Apr 2024" },
  { id: "5", name: "Meera Singh", phone: "+91 54321 09876", email: "meera.s@email.com", totalOrders: 56, totalSpent: 42300, lastOrder: "2 days ago", loyaltyTier: "gold", joinDate: "Dec 2023" },
  { id: "6", name: "Vikash Gupta", phone: "+91 43210 98765", email: "vikash.g@email.com", totalOrders: 89, totalSpent: 67800, lastOrder: "Today", loyaltyTier: "platinum", joinDate: "Sep 2023" },
];

const tierConfig = {
  bronze: { className: "bg-amber-800/20 text-amber-700 border-amber-700/30", label: "Bronze" },
  silver: { className: "bg-slate-400/20 text-slate-600 border-slate-400/30", label: "Silver" },
  gold: { className: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", label: "Gold" },
  platinum: { className: "bg-violet-500/20 text-violet-600 border-violet-500/30", label: "Platinum" },
};

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Customer Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Build relationships with your loyal customers
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-foreground">892</p>
          <p className="text-sm text-muted-foreground">Total Customers</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-success">+23</p>
          <p className="text-sm text-muted-foreground">New This Week</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-foreground">₹1,245</p>
          <p className="text-sm text-muted-foreground">Avg. Lifetime Value</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold font-display text-primary">68%</p>
          <p className="text-sm text-muted-foreground">Repeat Rate</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => {
          const tier = tierConfig[customer.loyaltyTier];

          return (
            <div
              key={customer.id}
              className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all animate-fade-in group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-lg font-semibold text-secondary-foreground">
                      {customer.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">Since {customer.joinDate}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{customer.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{customer.totalOrders}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">₹{customer.totalSpent.toLocaleString()}</span>
                  </div>
                </div>
                <Badge variant="outline" className={tier.className}>
                  <Star className="h-3 w-3 mr-1" />
                  {tier.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
