import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    MessageSquare,
    RefreshCcw,
    Edit,
    Send,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    User,
    Filter,
    ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetAdminTicketsQuery, useUpdateTicketStatusMutation, useRespondToTicketMutation, useGetTicketRepliesQuery } from "@/store/api";
import BottomNav from "@/components/BottomNav";
import { useI18n } from "@/lib/i18n";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { useAppSelector } from "@/store/hooks";
import { useFormatDate } from "@/lib/dateUtils";

const AdminTicketsPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t, dir, isRTL } = useI18n();
    const formatDate = useFormatDate();
    const currentUser = useAppSelector((state) => state.user.currentUser);
    
    // Safety check for date formatting
    const safeFormatDate = (date: string | null | undefined): string => {
        if (!date) return '';
        try {
            return formatDate.formatDateTime(date);
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };
    
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [ticketResponse, setTicketResponse] = useState('');
    const [ticketStatus, setTicketStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [saveLoading, setSaveLoading] = useState(false);

    // Show back button
    useTelegramBackButton({
        isVisible: true,
        onClick: () => navigate('/admin'),
    });

    const { data, isLoading, refetch } = useGetAdminTicketsQuery({});
    const [updateTicketStatus] = useUpdateTicketStatusMutation();
    const [respondToTicket] = useRespondToTicketMutation();
    
    // Get replies for selected ticket
    const { data: repliesData, refetch: refetchReplies } = useGetTicketRepliesQuery(selectedTicket?.id || '', {
        skip: !selectedTicket?.id || !isDrawerOpen,
    });
    const replies = repliesData?.replies || [];

    const tickets = data?.tickets || [];
    
    const filteredTickets = statusFilter === 'all' 
        ? tickets 
        : tickets.filter((t: any) => t.status === statusFilter);

    const handleTicketClick = (ticket: any) => {
        setSelectedTicket(ticket);
        setTicketStatus(ticket.status);
        setTicketResponse('');
        setIsDrawerOpen(true);
    };

    const handleUpdateTicket = async () => {
        if (!selectedTicket || !currentUser?.id) return;
        
        setSaveLoading(true);
        try {
            // Update status if changed
            if (ticketStatus !== selectedTicket.status) {
                await updateTicketStatus({
                    ticketId: selectedTicket.id,
                    status: ticketStatus,
                    adminId: currentUser.id,
                }).unwrap();
            }
            
            // Add response if provided
            if (ticketResponse && ticketResponse.trim()) {
                await respondToTicket({
                    ticketId: selectedTicket.id,
                    adminId: currentUser.id,
                    response: ticketResponse,
                }).unwrap();
            }
            
            toast({ title: t.common.success, description: t.tickets.ticketUpdated });
            setTicketResponse('');
            await refetchReplies();
            // Update selected ticket
            const updatedTickets = await refetch();
            const updatedTicket = updatedTickets.data?.tickets?.find((t: any) => t.id === selectedTicket.id);
            if (updatedTicket) {
                setSelectedTicket(updatedTicket);
                setTicketStatus(updatedTicket.status);
            }
        } catch (err: any) {
            toast({ title: t.common.error, description: err?.data?.error || t.tickets.errorUpdating, variant: "destructive" });
        } finally {
            setSaveLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">{t.tickets.open}</Badge>;
            case 'in_progress': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">{t.tickets.inProgress}</Badge>;
            case 'resolved': return <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{t.tickets.resolved}</Badge>;
            case 'closed': return <Badge variant="secondary" className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">{t.tickets.closed}</Badge>;
            default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'low': return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">{t.tickets.low}</Badge>;
            case 'normal': return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">{t.tickets.normal}</Badge>;
            case 'high': return <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-xs">{t.tickets.high}</Badge>;
            case 'urgent': return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{t.tickets.urgent}</Badge>;
            default: return <Badge variant="outline" className="text-xs">{priority}</Badge>;
        }
    };

    return (
        <div className={`min-h-screen flex flex-col pb-28 bg-background ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
            <div className="p-6 pt-12 max-w-lg mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/admin')}
                            className="rounded-xl"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <MessageSquare className="h-8 w-8" />
                        </div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                            <h1 className={`text-2xl font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.tickets.manageTickets}</h1>
                            <p className={`text-muted-foreground text-sm font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.tickets.reviewAndRespond}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className={`p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${isLoading ? "animate-spin" : ""}`}
                    >
                        <RefreshCcw size={16} />
                    </button>
                </motion.div>

                {/* Status Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="rounded-xl font-vazir whitespace-nowrap"
                        >
                            {status === 'all' ? t.tickets.all :
                             status === 'open' ? t.tickets.open :
                             status === 'in_progress' ? t.tickets.inProgress :
                             status === 'resolved' ? t.tickets.resolved : t.tickets.closed}
                        </Button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="py-12 text-center text-muted-foreground text-sm font-vazir">{t.tickets.loading}</div>
                ) : filteredTickets.length > 0 ? (
                    <div className="space-y-3">
                        {filteredTickets.map((ticket: any) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleTicketClick(ticket)}
                                className="glass p-5 rounded-3xl border border-white/5 space-y-4 shadow-lg cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(ticket.status)}
                                        {getPriorityBadge(ticket.priority)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock size={14} />
                                        {safeFormatDate(ticket.created_at)}
                                    </div>
                                </div>
                                <h3 className="font-bold text-base font-vazir">{ticket.subject}</h3>
                                <p className="text-sm text-muted-foreground font-vazir line-clamp-2">{ticket.message}</p>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User size={14} />
                                        <span>{ticket.first_name} {ticket.last_name} (@{ticket.username || 'N/A'})</span>
                                    </div>
                                    {ticket.admin_response && (
                                        <div className="flex items-center gap-2 text-xs text-green-400">
                                            <CheckCircle2 size={14} />
                                            <span>{t.tickets.replied}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center space-y-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 inline-block">
                            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
                        </div>
                        <p className="text-muted-foreground text-sm font-vazir">{t.tickets.noTicketsFound}</p>
                    </div>
                )}
            </div>

            {/* Ticket Detail Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <ScrollArea className="max-h-[85vh] overflow-y-auto">
                        <div className="p-6 space-y-6">
                            <DrawerHeader className="p-0">
                                <div className="flex items-center gap-2 mb-2">
                                    {selectedTicket && getStatusBadge(selectedTicket.status)}
                                    {selectedTicket && getPriorityBadge(selectedTicket.priority)}
                                </div>
                                <DrawerTitle className="text-xl font-black">{selectedTicket?.subject}</DrawerTitle>
                                <DrawerDescription className="font-vazir text-muted-foreground">
                                    {selectedTicket && safeFormatDate(selectedTicket.created_at)}
                                </DrawerDescription>
                            </DrawerHeader>

                            {selectedTicket ? (
                                <div className="space-y-4">
                                    {/* User Info */}
                                    <div className="pb-4 border-b border-white/10">
                                        <h4 className="font-semibold text-sm mb-2 font-vazir flex items-center gap-2">
                                            <User size={16} />
                                            {t.tickets.user}:
                                        </h4>
                                        <p className="text-sm font-vazir">
                                            {selectedTicket.first_name} {selectedTicket.last_name} (@{selectedTicket.username || 'N/A'})
                                        </p>
                                    </div>

                                    {/* Conversation Thread - Chat Style */}
                                    <div className="space-y-3 min-h-[300px]">
                                        {/* Original Message - User Side */}
                                        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] ${isRTL ? 'text-right' : 'text-left'}`}>
                                                <div className={`bg-blue-500/20 border border-blue-500/30 rounded-2xl ${isRTL ? 'rounded-bl-sm' : 'rounded-br-sm'} p-3 shadow-lg`}>
                                                    <p className="text-sm font-vazir whitespace-pre-wrap text-white">{selectedTicket.message}</p>
                                                    <p className="text-xs text-blue-200/70 mt-1.5">
                                                        {safeFormatDate(selectedTicket.created_at)}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 px-1 font-vazir">
                                                    {selectedTicket.first_name} {selectedTicket.last_name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Replies - Alternating Sides */}
                                        {replies.map((reply: any) => {
                                            const isAdmin = !!reply.admin_id;
                                            return (
                                                <div
                                                    key={reply.id}
                                                    className={`flex ${isAdmin ? (isRTL ? 'justify-end' : 'justify-start') : (isRTL ? 'justify-start' : 'justify-end')}`}
                                                >
                                                    <div className={`max-w-[80%] ${isAdmin ? (isRTL ? 'text-right' : 'text-left') : (isRTL ? 'text-right' : 'text-left')}`}>
                                                        <div
                                                            className={`rounded-2xl p-3 shadow-lg ${
                                                                isAdmin
                                                                    ? `bg-green-500/20 border border-green-500/30 ${isRTL ? 'rounded-bl-sm' : 'rounded-tl-sm'}`
                                                                    : `bg-blue-500/20 border border-blue-500/30 ${isRTL ? 'rounded-br-sm' : 'rounded-tr-sm'}`
                                                            }`}
                                                        >
                                                            <p className="text-sm font-vazir whitespace-pre-wrap text-white">{reply.message}</p>
                                                            <p className={`text-xs mt-1.5 ${isAdmin ? 'text-green-200/70' : 'text-blue-200/70'}`}>
                                                                {safeFormatDate(reply.created_at)}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1 px-1 font-vazir">
                                                            {isAdmin
                                                                ? `${reply.admin_first_name || ''} ${reply.admin_last_name || ''} (${t.tickets.support})`
                                                                : `${reply.user_first_name || ''} ${reply.user_last_name || ''}`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ticket-status">{t.tickets.status}</Label>
                                        <select
                                            id="ticket-status"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 font-vazir text-sm"
                                            value={ticketStatus}
                                            onChange={(e) => setTicketStatus(e.target.value as any)}
                                        >
                                            <option value="open">{t.tickets.open}</option>
                                            <option value="in_progress">{t.tickets.inProgress}</option>
                                            <option value="resolved">{t.tickets.resolved}</option>
                                            <option value="closed">{t.tickets.closed}</option>
                                        </select>
                                    </div>

                                    {/* Reply Section - Only show if ticket is open */}
                                    {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-response">{t.tickets.adminResponse}</Label>
                                            <Textarea
                                                id="ticket-response"
                                                className="bg-white/5 border-white/10 rounded-xl font-vazir resize-none"
                                                rows={6}
                                                value={ticketResponse}
                                                onChange={(e) => setTicketResponse(e.target.value)}
                                                placeholder={t.tickets.writeResponse}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-muted-foreground font-vazir">{t.tickets.loading}</p>
                                </div>
                            )}

                            <DrawerFooter className="p-0 gap-3">
                                <Button
                                    className="w-full rounded-xl font-bold h-12"
                                    onClick={handleUpdateTicket}
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? t.tickets.saving : t.tickets.saveChanges}
                                </Button>
                                <DrawerClose asChild>
                                    <Button variant="ghost" className="w-full rounded-xl h-12">{t.tickets.cancel}</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </div>
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

            <BottomNav />
        </div>
    );
};

export default AdminTicketsPage;
