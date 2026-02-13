import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Send, ArrowRight, User, ShieldCheck, Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import BottomNav from "@/components/BottomNav";
import { getTelegramUser } from "@/lib/telegram";
import { useI18n } from "@/lib/i18n";
import { useCreateTicketMutation, useGetUserTicketsQuery, useGetTicketRepliesQuery, useReplyToTicketMutation, useUpdateUserTicketStatusMutation } from "@/store/api";
import { useFormatDate } from "@/lib/dateUtils";

const TicketsPage = () => {
  const { t, dir, isRTL } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tgUser = getTelegramUser();
  const formatDate = useFormatDate();
  
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });
  
  const { data: ticketsData, isLoading, refetch } = useGetUserTicketsQuery(tgUser?.id || 0, {
    skip: !tgUser?.id,
  });
  const tickets = ticketsData?.tickets || [];
  
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
  
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();
  const [replyToTicket] = useReplyToTicketMutation();
  const [updateTicketStatus] = useUpdateUserTicketStatusMutation();
  
  // Get replies for selected ticket
  const { data: repliesData, refetch: refetchReplies } = useGetTicketRepliesQuery(selectedTicket?.id || '', {
    skip: !selectedTicket?.id || !isDetailDrawerOpen,
  });
  const replies = repliesData?.replies || [];
  
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
  
  const handleCreateTicket = async () => {
    if (!ticketForm.subject || !ticketForm.message) {
      toast({
        title: t.common.error,
        description: t.tickets.fillSubjectAndMessage,
        variant: "destructive",
      });
      return;
    }
    
    if (!tgUser?.id) {
      toast({
        title: t.common.error,
        description: t.tickets.userNotFound,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await createTicket({
        userId: tgUser.id,
        subject: ticketForm.subject,
        message: ticketForm.message,
        priority: ticketForm.priority,
      }).unwrap();
      
      if (result.success) {
        toast({
          title: t.common.success,
          description: t.tickets.ticketCreated,
        });
        setIsCreateDrawerOpen(false);
        setTicketForm({ subject: '', message: '', priority: 'normal' });
        refetch();
      } else {
        toast({
          title: t.common.error,
          description: result.error || t.tickets.errorCreating,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.tickets.errorCreating,
        variant: "destructive",
      });
    }
  };
  
  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setIsDetailDrawerOpen(true);
  };
  
  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !tgUser?.id) {
      toast({
        title: t.common.error,
        description: t.tickets.enterMessage,
        variant: "destructive",
      });
      return;
    }
    
    if (selectedTicket.status !== 'open' && selectedTicket.status !== 'in_progress') {
      toast({
        title: t.common.error,
        description: t.tickets.onlyOpenTickets,
        variant: "destructive",
      });
      return;
    }
    
    setIsReplying(true);
    try {
      const result = await replyToTicket({
        ticketId: selectedTicket.id,
        userId: tgUser.id,
        message: replyMessage,
      }).unwrap();
      
      if (result.success) {
        toast({
          title: t.common.success,
          description: t.tickets.replySent,
        });
        setReplyMessage('');
        refetch();
        refetchReplies();
        // Refetch ticket to get updated status
        const updatedTickets = await refetch();
        const updatedTicket = updatedTickets.data?.tickets?.find((t: any) => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      } else {
        toast({
          title: t.common.error,
          description: result.error || t.tickets.errorSending,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.tickets.errorSending,
        variant: "destructive",
      });
    } finally {
      setIsReplying(false);
    }
  };
  
  const handleToggleStatus = async (newStatus: 'open' | 'closed') => {
    if (!selectedTicket || !tgUser?.id) return;
    
    try {
      const result = await updateTicketStatus({
        ticketId: selectedTicket.id,
        userId: tgUser.id,
        status: newStatus,
      }).unwrap();
      
      if (result.success) {
        toast({
          title: t.common.success,
          description: newStatus === 'open' ? t.tickets.ticketOpened : t.tickets.ticketClosed,
        });
        refetch();
        // Update selected ticket
        const updatedTickets = await refetch();
        const updatedTicket = updatedTickets.data?.tickets?.find((t: any) => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      } else {
        toast({
          title: t.common.error,
          description: result.error || t.tickets.errorChangingStatus,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.tickets.errorChangingStatus,
        variant: "destructive",
      });
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
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className={`text-2xl font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.tickets.supportTickets}</h1>
              <p className={`text-muted-foreground text-sm font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.tickets.title}</p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="rounded-xl h-10 gap-2 font-vazir"
            size="sm"
          >
            <Plus size={16} />
            {t.tickets.newTicket}
          </Button>
        </motion.div>
        
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm font-vazir">{t.tickets.loading}</div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
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
                {ticket.admin_response && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 size={14} />
                    <span>{t.tickets.responseReceived}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 inline-block">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
            </div>
            <p className="text-muted-foreground text-sm font-vazir">{t.tickets.noTickets}</p>
            <Button
              onClick={() => setIsCreateDrawerOpen(true)}
              className="rounded-xl gap-2 font-vazir"
            >
              <Plus size={16} />
              {t.tickets.createNewTicket}
            </Button>
          </div>
        )}
      </div>
      
      {/* Create Ticket Drawer */}
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
          <ScrollArea className="max-h-[85vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <DrawerHeader className="p-0">
                <DrawerTitle className="text-xl font-black">{t.tickets.createNewTicket}</DrawerTitle>
                <DrawerDescription className="font-vazir text-muted-foreground">
                  {t.tickets.registerSupportRequest}
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-subject">{t.tickets.ticketSubject}</Label>
                  <Input
                    id="ticket-subject"
                    className="bg-white/5 border-white/10 rounded-xl font-vazir"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    placeholder={t.tickets.ticketSubjectPlaceholder}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ticket-priority">{t.tickets.priority}</Label>
                  <select
                    id="ticket-priority"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 font-vazir text-sm"
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                  >
                    <option value="low">{t.tickets.low}</option>
                    <option value="normal">{t.tickets.normal}</option>
                    <option value="high">{t.tickets.high}</option>
                    <option value="urgent">{t.tickets.urgent}</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ticket-message">{t.tickets.ticketMessage}</Label>
                  <Textarea
                    id="ticket-message"
                    className="bg-white/5 border-white/10 rounded-xl font-vazir resize-none"
                    rows={6}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    placeholder={t.tickets.writeFullDescription}
                  />
                </div>
              </div>
              
              <DrawerFooter className="p-0 gap-3">
                <Button
                  className="w-full rounded-xl font-bold h-12"
                  onClick={handleCreateTicket}
                  disabled={isCreating}
                >
                  {isCreating ? t.tickets.sending : t.tickets.createTicket}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="rounded-xl h-12">{t.tickets.cancel}</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
      
      {/* Ticket Detail Drawer */}
      <Drawer open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
        <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
          <ScrollArea className="max-h-[85vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <DrawerHeader className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(selectedTicket?.status)}
                  {getPriorityBadge(selectedTicket?.priority)}
                </div>
                <DrawerTitle className="text-xl font-black">{selectedTicket?.subject}</DrawerTitle>
                <DrawerDescription className="font-vazir text-muted-foreground">
                  {safeFormatDate(selectedTicket?.created_at)}
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="space-y-4">
                {/* Conversation Thread - Chat Style */}
                <div className="space-y-3 min-h-[300px]">
                  {/* Original Message - User Side */}
                  <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className={`bg-blue-500/20 border border-blue-500/30 rounded-2xl ${isRTL ? 'rounded-br-sm' : 'rounded-bl-sm'} p-3 shadow-lg`}>
                        <p className="text-sm font-vazir whitespace-pre-wrap text-white">{selectedTicket?.message}</p>
                        <p className="text-xs text-blue-200/70 mt-1.5">{safeFormatDate(selectedTicket?.created_at)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 px-1 font-vazir">{t.tickets.you}</p>
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
                              ? `${reply.admin_first_name} ${reply.admin_last_name} (${t.tickets.support})`
                              : t.tickets.you
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Reply Section - Only show if ticket is open */}
                {(selectedTicket?.status === 'open' || selectedTicket?.status === 'in_progress') && (
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <Label htmlFor="reply-message">{t.tickets.yourReply}</Label>
                    <Textarea
                      id="reply-message"
                      className="bg-white/5 border-white/10 rounded-xl font-vazir resize-none"
                      rows={4}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={t.tickets.replyPlaceholder}
                    />
                    <Button
                      onClick={handleReply}
                      disabled={isReplying || !replyMessage.trim()}
                      className="w-full rounded-xl gap-2 font-vazir"
                    >
                      <Send size={16} />
                      {isReplying ? t.tickets.sending : t.tickets.sendReply}
                    </Button>
                  </div>
                )}
                
                {/* Status Toggle */}
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  {selectedTicket?.status === 'open' || selectedTicket?.status === 'in_progress' ? (
                    <Button
                      variant="outline"
                      onClick={() => handleToggleStatus('closed')}
                      className="flex-1 rounded-xl gap-2 font-vazir border-red-500/20 text-red-400 hover:bg-red-500/10"
                    >
                      <Lock size={16} />
                      {t.tickets.closeTicket}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleToggleStatus('open')}
                      className="flex-1 rounded-xl gap-2 font-vazir border-green-500/20 text-green-400 hover:bg-green-500/10"
                    >
                      <Unlock size={16} />
                      {t.tickets.openTicket}
                    </Button>
                  )}
                </div>
              </div>
              
              <DrawerFooter className="p-0">
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full rounded-xl h-12">{t.tickets.close}</Button>
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

export default TicketsPage;
