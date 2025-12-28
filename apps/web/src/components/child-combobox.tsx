"use client";

import * as React from "react";
import { Check, ChevronsUpDown, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useChildren } from "@/hooks/use-children";
import { Badge } from "@/components/ui/badge";

interface ChildComboboxProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
}

export function ChildCombobox({ value, onValueChange, placeholder = "Select child..." }: ChildComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const { data: children, isLoading } = useChildren();

    const selectedChild = children?.find((child: any) => child.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedChild ? (
                        <div className="flex items-center gap-2">
                            <span>{selectedChild.firstName} {selectedChild.lastName}</span>
                            {selectedChild.hasAllergy && (
                                <Badge variant="destructive" className="text-xs px-1.5">
                                    <AlertTriangle className="h-3 w-3" />
                                </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                                {selectedChild.room?.name}
                            </Badge>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={true}>
                    <CommandInput placeholder="Search children by name..." />
                    <CommandList>
                        <CommandEmpty>No children found.</CommandEmpty>
                        <CommandGroup>
                            {isLoading ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Loading children...
                                </div>
                            ) : (
                                children?.map((child: any) => (
                                    <CommandItem
                                        key={child.id}
                                        value={`${child.firstName} ${child.lastName}`}
                                        onSelect={() => {
                                            onValueChange(child.id);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === child.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="font-medium">
                                                {child.firstName} {child.lastName}
                                            </span>
                                            {child.hasAllergy && (
                                                <Badge variant="destructive" className="text-xs px-1.5">
                                                    <AlertTriangle className="h-3 w-3 mr-0.5" />
                                                    Allergy
                                                </Badge>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="text-xs ml-2">
                                            {child.room?.name || 'Unassigned'}
                                        </Badge>
                                    </CommandItem>
                                ))
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
