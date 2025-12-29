'use client';

import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPence } from '@/hooks/use-billing';

export interface Payment {
    id: string;
    amountPence: number;
    method: string;
    reference?: string;
    receivedAt: string;
}

export interface PaymentHistoryCardProps {
    payments: Payment[] | undefined;
}

export function PaymentHistoryCard({ payments }: PaymentHistoryCardProps) {
    if (!payments || payments.length === 0) return null;

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium">{formatPence(payment.amountPence)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {payment.method.replace('_', ' ')}
                                        {payment.reference && ` • ${payment.reference}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                {new Date(payment.receivedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
