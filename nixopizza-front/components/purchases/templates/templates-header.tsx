"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

export function TemplatesHeader({
  onSearchChange,
  onCreateClick,
}: {
  onSearchChange: (search: string) => void;
  onCreateClick: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Purchase Templates
          </h1>
          <p className="text-muted-foreground">
            Manage your reusable purchase templates
          </p>
        </div>
        <Button onClick={onCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
      </div>
    </div>
  );
}
