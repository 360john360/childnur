'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';

export interface Parent {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    children: { id: string; firstName: string; lastName: string }[];
}

export interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    parents: Parent[] | undefined;
    onStartConversation: (parentId: string, childId?: string) => void;
    isCreating?: boolean;
}

export function NewConversationModal({
    isOpen,
    onClose,
    parents,
    onStartConversation,
    isCreating = false,
}: NewConversationModalProps) {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filteredParents = parents?.filter(p =>
        p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName.toLowerCase().includes(search.toLowerCase()) ||
        p.children.some(c =>
            c.firstName.toLowerCase().includes(search.toLowerCase()) ||
            c.lastName.toLowerCase().includes(search.toLowerCase())
        )
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div>
                        <h2 className="text-lg font-semibold">New Conversation</h2>
                        <p className="text-sm text-muted-foreground">Select a parent to message</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search parents or children..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[400px]">
                    {filteredParents?.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <p>No parents found</p>
                        </div>
                    ) : (
                        filteredParents?.map((parent) => (
                            <div key={parent.id} className="border-b last:border-0">
                                <div className="p-4 bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-semibold">
                                            {parent.firstName[0]}{parent.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium">{parent.firstName} {parent.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{parent.email}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    {parent.children.map((child) => (
                                        <button
                                            key={child.id}
                                            onClick={() => onStartConversation(parent.id, child.id)}
                                            disabled={isCreating}
                                            className="w-full p-3 text-left hover:bg-muted rounded-xl transition-colors flex items-center justify-between group"
                                        >
                                            <span className="text-sm">
                                                About <strong>{child.firstName}</strong>
                                            </span>
                                            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                Message →
                                            </span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => onStartConversation(parent.id)}
                                        disabled={isCreating}
                                        className="w-full p-3 text-left hover:bg-muted rounded-xl transition-colors flex items-center justify-between text-muted-foreground group"
                                    >
                                        <span className="text-sm">General message</span>
                                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            Message →
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
