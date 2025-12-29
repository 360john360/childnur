'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatPence } from '@/hooks/use-billing';

export const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Card' },
    { value: 'TAX_FREE_CHILDCARE', label: 'Tax-Free Childcare' },
    { value: 'CHILDCARE_VOUCHER', label: 'Childcare Voucher' },
    { value: 'DIRECT_DEBIT', label: 'Direct Debit' },
    { value: 'OTHER', label: 'Other' },
];

export interface RecordPaymentDialogProps {
    outstandingPence: number;
    onRecordPayment: (data: {
        amountPence: number;
        method: string;
        reference?: string;
        notes?: string;
    }) => Promise<void>;
    isPending: boolean;
}

export function RecordPaymentDialog({
    outstandingPence,
    onRecordPayment,
    isPending,
}: RecordPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const handleSubmit = async () => {
        const amountPence = Math.round(parseFloat(paymentAmount) * 100);
        if (!amountPence || amountPence <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        await onRecordPayment({
            amountPence,
            method: paymentMethod,
            reference: paymentReference || undefined,
            notes: paymentNotes || undefined,
        });

        setOpen(false);
        setPaymentAmount('');
        setPaymentReference('');
        setPaymentNotes('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Outstanding: {formatPence(outstandingPence)}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Amount (£)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={(outstandingPence / 100).toFixed(2)}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Reference (Optional)</Label>
                        <Input
                            placeholder="e.g., Bank ref, TFC code"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            placeholder="Any notes about this payment..."
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? 'Recording...' : 'Record Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
