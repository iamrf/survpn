import React, { useState } from "react";
import { motion } from "framer-motion";
import { Info, AlertTriangle, AlertCircle, CheckCircle, Activity, X } from "lucide-react";
import { useGetUserMessagesQuery } from "@/store/api";
import { getTelegramUser } from "@/lib/telegram";
import { useI18n } from "@/lib/i18n";

const UserMessages: React.FC = () => {
  const { dir, isRTL } = useI18n();
  const tgUser = getTelegramUser();
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

  // Get user messages
  const { data: messagesData } = useGetUserMessagesQuery(tgUser?.id || 0, { skip: !tgUser?.id });
  const messages = messagesData?.messages || [];

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'danger': return <AlertCircle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'status': return <Activity className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'danger': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'success': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'status': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleDismissMessage = (messageId: string) => {
    setDismissedMessages(prev => new Set([...prev, messageId]));
  };

  const visibleMessages = messages.filter(msg => !dismissedMessages.has(msg.id));

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="px-5 pt-6 space-y-3">
      {visibleMessages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-2xl border p-4 backdrop-blur-xl ${getMessageTypeColor(msg.type)}`}
          dir={dir}
        >
          <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-xl ${getMessageTypeColor(msg.type)} shrink-0`}>
              {getMessageTypeIcon(msg.type)}
            </div>
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
              <h4 className="font-bold text-sm font-vazir mb-1">
                {msg.title}
              </h4>
              <p className="text-xs font-vazir opacity-90">
                {msg.message}
              </p>
            </div>
            <button
              onClick={() => handleDismissMessage(msg.id)}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 ${isRTL ? 'mr-auto' : 'ml-auto'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default UserMessages;
