import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, SendHorizontal } from 'lucide-react';
import { createCustomSubscription } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { getTelegramUser } from '@/lib/telegram';

const CustomSubscriptionDialog: React.FC = () => {
    const [traffic, setTraffic] = useState<string>('50');
    const [duration, setDuration] = useState<string>('30');
    const [notes, setNotes] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = getTelegramUser();
        if (!user) return;

        setIsLoading(true);
        try {
            const result = await createCustomSubscription(user.id, parseInt(traffic), parseInt(duration), notes);
            if (result.success) {
                toast({
                    title: "Request Submitted",
                    description: result.message,
                });
                setIsOpen(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to submit request",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full py-6 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
                    <Settings2 className="w-5 h-5 mr-2" />
                    Configure Custom Plan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Custom Subscription</DialogTitle>
                        <DialogDescription>
                            Tell us what you need and we'll create a personal plan for you.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="traffic">Traffic (GB)</Label>
                                <Input
                                    id="traffic"
                                    type="number"
                                    value={traffic}
                                    onChange={(e) => setTraffic(e.target.value)}
                                    placeholder="50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Days)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="30"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="I need high speed for gaming..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Submitting..." : (
                                <>
                                    Submit Request
                                    <SendHorizontal className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CustomSubscriptionDialog;
