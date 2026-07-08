"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getProcedureCatalog } from "@/lib/api";
import type { ProcedureCatalog } from "@/types";

interface ProcedurePickerProps {
  value: string;
  onChange: (procedureId: string, procedure: ProcedureCatalog) => void;
  disabled?: boolean;
}

export function ProcedurePicker({ value, onChange, disabled }: ProcedurePickerProps) {
  const [open, setOpen] = useState(false);
  const [procedures, setProcedures] = useState<ProcedureCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getProcedureCatalog().then((data) => {
      setProcedures(data);
      setLoading(false);
    });
  }, []);

  const selected = procedures.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-left font-normal"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando...
            </span>
          ) : selected ? (
            <span className="truncate">
              {selected.code} — {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Seleccionar procedimiento...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar procedimiento..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No se encontraron procedimientos.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {procedures.map((proc) => (
                <CommandItem
                  key={proc.id}
                  value={`${proc.code} ${proc.name} ${proc.category || ""}`}
                  onSelect={() => {
                    onChange(proc.id, proc);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{proc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {proc.code} — ${Number(proc.defaultPrice).toLocaleString()}
                      </span>
                    </div>
                    {proc.id === value && (
                      <Check className="h-4 w-4 shrink-0 ml-2" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
