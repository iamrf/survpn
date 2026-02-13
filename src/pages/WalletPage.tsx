import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Wallet, Plus, CreditCard, ArrowUpRight, History, ArrowDownLeft, X, CheckCircle2, Clock, Share2, Users, TrendingUp, Copy, Gift, Star, Coins, RefreshCw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TelegramButton } from "@/components/TelegramButton";
// Temporarily disabled to debug crash
// import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
// import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { hapticImpact, hapticNotification, hapticSelection } from "@/lib/telegram";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { WalletBalanceSkeleton, TransactionSkeleton } from "@/components/skeletons";
import { motion } from "framer-motion";
import { getTelegramUser } from "@/lib/telegram";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectPendingPlisioTransactions } from "@/store/selectors";
import { 
  useCreatePaymentMutation, 
  useSyncUserMutation,
  useGetCurrentUserQuery,
  useGetTransactionHistoryQuery, 
  useRequestWithdrawalMutation, 
  useCancelWithdrawalMutation,
  useGetReferralStatsQuery,
  useGetConfigsQuery,
  useVerifyPlisioTransactionMutation
} from "@/store/api";
import {
  setPendingTransactions,
  addPendingTransaction,
  syncTransactionsFromHistory,
} from "@/store/slices/transactionsSlice";
import { useTransactionPolling } from "@/hooks/useTransactionPolling";
import { useI18n } from "@/lib/i18n";

const WalletPage = () => {
  const { t, dir, isRTL } = useI18n();
  const tgUser = getTelegramUser();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPasskey, setWithdrawPasskey] = useState("");
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'plisio' | 'telegram_stars'>('telegram_stars');
  const { toast } = useToast();

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isCheckingPending, setIsCheckingPending] = useState(false);

  // Initialize transaction polling - this automatically checks pending transactions
  const { isChecking, pendingTransactions: pollingPendingTxs, checkAllPendingTransactions } = useTransactionPolling();

  // Telegram BackButton - hide on wallet page (it's a main page)
  // Hook is safe - returns no-ops if Telegram WebApp is not available
  // Temporarily disabled to debug crash
  // useTelegramBackButton({ isVisible: false });

  // RTK Query hooks
  const [syncUser] = useSyncUserMutation();
  const [createPayment, { isLoading: paymentLoading }] = useCreatePaymentMutation();
  const [verifyPlisioTransaction] = useVerifyPlisioTransactionMutation();
  const [requestWithdrawal, { isLoading: withdrawLoading }] = useRequestWithdrawalMutation();
  const [cancelWithdrawal] = useCancelWithdrawalMutation();

  // Subscribe to user data query for automatic refresh via tag invalidation
  // Refetch when window regains focus to ensure balance is up-to-date
  useGetCurrentUserQuery(tgUser, { 
    skip: !tgUser,
    refetchOnFocus: true,
  });
  
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useGetTransactionHistoryQuery(
    tgUser?.id || 0,
    { skip: !tgUser?.id }
  );

  const { data: referralStatsData, isLoading: referralStatsLoading } = useGetReferralStatsQuery(
    tgUser?.id || 0,
    { skip: !tgUser?.id }
  );

  const { data: configsData } = useGetConfigsQuery();

  // Get checking transactions from Redux for UI indicators
  const checkingTransactions = useAppSelector((state) => state.transactions.checkingTransactions);
  const lastCheckedAt = useAppSelector((state) => state.transactions.lastCheckedAt);
  const autoCheckEnabled = useAppSelector((state) => state.transactions.autoCheckEnabled);

  // Sync RTK Query history with Redux store - intelligently merge pending transactions
  useEffect(() => {
    if (historyData?.history) {
      // Use smart sync that preserves transactions being checked
      dispatch(syncTransactionsFromHistory(historyData.history));
    }
  }, [historyData, dispatch]);

  // Show/hide MainButton based on amount input - temporarily disabled
  // useEffect(() => {
  //   const numAmount = parseFloat(amount);
  //   if (numAmount > 0 && !paymentLoading) {
  //     setMainButtonText(paymentMethod === 'telegram_stars' ? 'شارژ با ستاره‌های تلگرام' : 'شارژ حساب با رمزارز');
  //     showMainButton();
  //   } else {
  //     hideMainButton();
  //   }
  // }, [amount, paymentMethod, paymentLoading, showMainButton, hideMainButton, setMainButtonText]);

  // Handle payment redirect from Plisio ("go to site" button)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const txId = searchParams.get('tx');
    
    if (paymentStatus === 'pending' && txId) {
      // User was redirected from Plisio - try to verify this specific transaction
      toast({
        title: t.wallet.checkingPayment,
        description: t.wallet.checkingPaymentStatus,
      });
      
      // Verify the specific transaction
      verifyPlisioTransaction({
        order_number: txId,
        txn_id: txId,
      }).unwrap().then((result: any) => {
        if (result.updated) {
          toast({
            title: t.wallet.paymentSuccess,
            description: t.wallet.paymentConfirmed.replace('{txId}', txId),
          });
        } else if (result.already_completed) {
          toast({
            title: t.wallet.transactionCompleted,
            description: t.wallet.transactionAlreadyCompleted,
          });
        } else {
          toast({
            title: t.wallet.paymentPending,
            description: t.wallet.waitingForConfirmation,
            variant: "destructive",
          });
        }
      }).catch((err: any) => {
        console.error('Error verifying payment:', err);
        toast({
          title: t.wallet.paymentPending,
          description: t.wallet.checkingTransactions,
        });
      });
      
      // Clean up URL
      searchParams.delete('payment');
      searchParams.delete('tx');
      setSearchParams(searchParams, { replace: true });
    } else if (paymentStatus === 'success') {
      // Legacy success redirect - just refresh data
      toast({
        title: t.wallet.checkingPayment,
        description: t.wallet.checkingPaymentStatus,
      });
      
      // Refresh history
      refetchHistory();
      
      // Clean up URL
      searchParams.delete('payment');
      searchParams.delete('tx');
      setSearchParams(searchParams, { replace: true });
      }
  }, [searchParams, setSearchParams, tgUser, verifyPlisioTransaction, refetchHistory, toast]);

  const history = historyData?.history || [];
  const balance = currentUser?.balance || 0;
  const walletAddress = currentUser?.walletAddress || "";
  const hasPasskey = currentUser?.hasPasskey || false;
  const referralCode = currentUser?.referralCode || "";
  const referralStats = referralStatsData?.stats || { referralCount: 0, totalCommissions: 0, recentCommissions: [], referredUsers: [] };
  const [referralLink, setReferralLink] = useState<string>("");
  
  // Get referral pricing from configs or user settings
  const configs = configsData?.configs || {};
  const defaultRegistrationBonus = parseFloat(configs['referral_registration_bonus'] || '1.00');
  const defaultCommissionRate = parseFloat(configs['default_referral_commission_rate'] || '10.00');
  
  // Use user's custom rates if available, otherwise use defaults
  // Note: These fields might not be in currentUser yet, so we'll use defaults for now
  const userRegistrationBonus = defaultRegistrationBonus;
  const userCommissionRate = defaultCommissionRate;

  // Load referral link when referral code is available
  useEffect(() => {
    if (!referralCode) {
      setReferralLink("");
      return;
    }
    // Use BotFather Direct Link format: t.me/bot/refer?ref=CODE
    // Falls back to standard ?start= format if Direct Link not configured
    import('@/lib/telegram').then(({ getTelegramBotUsername }) => {
      const botUsername = getTelegramBotUsername();
      // Option 1: BotFather Direct Link (recommended for branding)
      // Format: t.me/bot_username/refer?ref=CODE
      setReferralLink(`https://t.me/${botUsername}/refer?ref=${referralCode}`);
      
      // Option 2: Standard ?start= link (fallback, works automatically)
      // Uncomment below and comment above if you prefer standard links:
      // setReferralLink(`https://t.me/${botUsername}?start=${referralCode}`);
    });
  }, [referralCode]);

  // User data is automatically synced via getCurrentUser query in App.tsx
  // and kept up-to-date via RTK Query tag invalidation

  // Define handleTopUp using useCallback so it can be referenced by hooks
  const handleTopUp = useCallback(async () => {
    hapticImpact('medium');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      hapticNotification('error');
      toast({
        title: t.common.error,
        description: t.wallet.invalidAmount,
        variant: "destructive",
      });
      return;
    }

      if (!tgUser) {
        toast({
          title: t.common.error,
          description: t.wallet.userNotFound,
          variant: "destructive",
        });
        return;
      }

    try {
      const result = await createPayment({ 
        userId: tgUser.id, 
        amount: numAmount,
        paymentMethod: paymentMethod
      }).unwrap();
      
      if (result.success) {
        if (paymentMethod === 'telegram_stars') {
          // Handle Telegram Stars payment
          const webApp = window.Telegram?.WebApp;
          
          if (result.invoice_url && webApp?.openLink) {
            // Open invoice link using WebApp API
            webApp.openLink(result.invoice_url);
            
            // Set up polling to check payment status via syncUser
            // This is needed for Telegram Stars since there's no callback mechanism
            let checkCount = 0;
            const maxChecks = 60; // 2 minutes (60 * 2 seconds)
            const previousBalance = balance;
            
            const checkInterval = setInterval(async () => {
              checkCount++;
              try {
                const updatedUser = await syncUser(tgUser).unwrap();
                // Check if balance increased (payment completed)
                if (updatedUser.balance && updatedUser.balance > previousBalance) {
                  clearInterval(checkInterval);
                  hapticNotification('success');
                  toast({
                    title: t.common.success,
                    description: t.wallet.paymentSuccess,
                  });
                  setAmount("");
                } else if (checkCount >= maxChecks) {
                  clearInterval(checkInterval);
                }
              } catch (err) {
                console.error('Error checking payment status:', err);
                if (checkCount >= maxChecks) {
                  clearInterval(checkInterval);
                }
              }
            }, 2000); // Check every 2 seconds
          } else if (result.invoice_data) {
            // Fallback: if invoice_url is not available, show error
            toast({
              title: t.common.error,
              description: t.wallet.paymentLinkError,
              variant: "destructive",
            });
          } else {
            toast({
              title: t.common.error,
              description: t.wallet.telegramStarsNotAvailable,
              variant: "destructive",
            });
          }
        } else if (result.invoice_url) {
          // Handle Plisio payment
          // Add transaction to Redux for automatic polling
          if (result.order_id) {
            dispatch(addPendingTransaction({
              id: result.order_id,
              user_id: tgUser.id,
              type: 'deposit',
              amount: numAmount,
              status: 'pending',
              payment_method: paymentMethod,
              plisio_invoice_id: result.order_id, // Will be updated when we get the actual invoice ID
              created_at: new Date().toISOString(),
            }));
          }
          
          // Open payment gateway in new tab using Telegram SDK
          // This keeps the Mini App open while user completes payment
          // Reference: https://docs.telegram-mini-apps.com/platform/methods#web_app_open_link
          import('@/lib/telegram-sdk').then(({ TelegramSDK }) => {
            try {
              // Use web_app_open_link which opens in default browser (new tab/window)
              // Mini App will NOT be closed, allowing user to return after payment
              TelegramSDK.openLinkInNewTab(result.invoice_url);
              hapticNotification('success');
              toast({
                title: t.common.success,
                description: t.wallet.paymentLinkError, // TODO: Update translation key
              });
            } catch (e) {
              console.error('Error opening payment link:', e);
              // Fallback to direct API if SDK not available
              const webApp = window.Telegram?.WebApp;
              if (webApp?.openLink) {
                webApp.openLink(result.invoice_url);
              } else {
                // Last resort: open in new window
                window.open(result.invoice_url, '_blank');
              }
            }
          }).catch((e) => {
            console.error('Error loading Telegram SDK:', e);
            // Fallback
            const webApp = window.Telegram?.WebApp;
            if (webApp?.openLink) {
              webApp.openLink(result.invoice_url);
            } else {
              window.open(result.invoice_url, '_blank');
            }
          });
        } else {
          toast({
            title: t.common.error,
            description: result.error || t.common.error,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t.common.error,
          description: result.error || t.common.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t.common.error,
        description: error?.data?.error || "مشکلی در اتصال به سرور پیش آمد",
        variant: "destructive",
      });
    }
  }, [amount, paymentMethod, paymentLoading, tgUser, createPayment, syncUser, balance, dispatch, toast]);

  // Telegram MainButton hook - temporarily disabled to debug crash
  // const { show: showMainButton, hide: hideMainButton, setText: setMainButtonText } = useTelegramMainButton({
  //   text: paymentMethod === 'telegram_stars' ? 'شارژ با ستاره‌های تلگرام' : 'شارژ حساب با رمزارز',
  //   onClick: handleTopUp,
  //   isVisible: false, // Will show when amount is entered
  //   isActive: !paymentLoading && amount && parseFloat(amount) > 0,
  // });

  // Show/hide MainButton based on amount input - temporarily disabled
  // useEffect(() => {
  //   if (!showMainButton || !hideMainButton || !setMainButtonText) return;
  //   
  //   const numAmount = parseFloat(amount);
  //   if (numAmount > 0 && !paymentLoading) {
  //     try {
  //       setMainButtonText(paymentMethod === 'telegram_stars' ? 'شارژ با ستاره‌های تلگرام' : 'شارژ حساب با رمزارز');
  //       showMainButton();
  //     } catch (e) {
  //       console.warn('Error updating MainButton:', e);
  //     }
  //   } else {
  //     try {
  //       hideMainButton();
  //     } catch (e) {
  //       console.warn('Error hiding MainButton:', e);
  //     }
  //   }
  // }, [amount, paymentMethod, paymentLoading, showMainButton, hideMainButton, setMainButtonText]);

  const handleWithdraw = async () => {
    hapticImpact('medium');
    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      hapticNotification('error');
      toast({ title: t.common.error, description: t.wallet.invalidAmount, variant: "destructive" });
      return;
    }

    if (!walletAddress) {
      toast({
        title: t.common.error,
        description: t.settings.walletAddressNotSet,
        variant: "destructive"
      });
      return;
    }

    if (!hasPasskey) {
      toast({
        title: t.common.error,
        description: t.settings.passkeyNotSet,
        variant: "destructive"
      });
      return;
    }

    if (withdrawPasskey.length !== 4) {
      toast({ title: t.common.error, description: t.settings.passkeyLength, variant: "destructive" });
      return;
    }

    if (!tgUser) return;

    try {
      const result = await requestWithdrawal({
        userId: tgUser.id,
        amount: numAmount,
        currency: "USD",
        passkey: withdrawPasskey
      }).unwrap();
      
      if (result.success) {
        hapticNotification('success');
        toast({ title: t.common.success, description: t.wallet.withdrawSuccess });
        setWithdrawAmount("");
        setWithdrawPasskey("");
        // User data and history are auto-refreshed via RTK Query tag invalidation
        setIsWithdrawOpen(false);
      } else {
        hapticNotification('error');
        toast({ title: t.common.error, description: result.error || t.wallet.withdrawError, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ 
        title: t.common.error, 
        description: error?.data?.error || t.errors.networkError, 
        variant: "destructive" 
      });
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    if (!confirm(t.wallet.cancelWithdraw + "?")) return;

    if (!tgUser) return;

    setCancelLoading(withdrawalId);
    try {
      const result = await cancelWithdrawal({
        userId: tgUser.id,
        withdrawalId
      }).unwrap();
      
      if (result.success) {
        toast({ title: t.common.success, description: t.wallet.withdrawCancelled });
        // User data and history are auto-refreshed via RTK Query tag invalidation
      } else {
        toast({ title: t.common.error, description: result.error || t.wallet.withdrawError, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ 
        title: t.common.error, 
        description: error?.data?.error || t.errors.networkError, 
        variant: "destructive" 
      });
    } finally {
      setCancelLoading(null);
    }
  };

  // Get pending transactions from Redux store using memoized selector
  const allPendingTransactions = useAppSelector(selectPendingPlisioTransactions);

  const handleCheckPendingTransactions = async () => {
    if (!tgUser?.id || isCheckingPending) return; // Prevent concurrent calls
    
    hapticImpact('light');
    setIsCheckingPending(true);
    
    // Limit to 3 transactions at a time
    const transactionsToCheck = allPendingTransactions.slice(0, 3);

    if (transactionsToCheck.length === 0) {
      toast({
        title: t.common.success,
        description: t.wallet.noTransactions,
      });
      setIsCheckingPending(false);
      return;
    }

    let verifiedCount = 0;
    let failedCount = 0;
    let alreadyCompletedCount = 0;

    // Check transactions sequentially with delay to avoid overwhelming the API
    for (const tx of transactionsToCheck) {
      try {
        // Add delay between checks (except for the first one)
        if (verifiedCount + failedCount + alreadyCompletedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between checks
        }
        
        const result = await verifyPlisioTransaction({
          order_number: tx.id,
          txn_id: tx.plisio_invoice_id || tx.id
        }).unwrap();

        if (result.success) {
          if ((result as any).updated) {
            verifiedCount++;
          } else if ((result as any).already_completed) {
            alreadyCompletedCount++;
          } else {
            // Transaction verified but not updated (still pending)
            failedCount++;
          }
        } else {
          failedCount++;
        }
      } catch (error: any) {
        console.error('Error verifying transaction:', error);
        failedCount++;
      }
    }

    // User data and history will be automatically refreshed via RTK Query cache invalidation
    // The verifyPlisioTransaction mutation already invalidates 'User' and 'Transactions' tags
    // No need to manually call syncUser or refetchHistory

    // Show summary toast
    const messages = [];
    if (verifiedCount > 0) {
      messages.push(`${verifiedCount} ${t.wallet.transactionCompleted}`);
    }
    if (alreadyCompletedCount > 0) {
      messages.push(`${alreadyCompletedCount} ${t.wallet.transactionAlreadyCompleted}`);
    }
    if (failedCount > 0) {
      messages.push(`${failedCount} ${t.wallet.transactionPending}`);
    }

    toast({
      title: verifiedCount > 0 ? t.common.success : t.wallet.checkTransactions,
      description: messages.length > 0 ? messages.join(', ') : t.wallet.checkTransactions,
      variant: verifiedCount > 0 ? "default" : "default",
    });

    setIsCheckingPending(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':      // legacy DB entries
      case 'mismatch':  // Plisio: paid but wrong amount
        return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">{t.wallet.transactionCompleted}</Badge>;
      case 'pending':
      case 'new':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{t.wallet.transactionPending}</Badge>;
      case 'expired': return <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">{t.subscription.expired}</Badge>;
      case 'cancelled': return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">{t.settings.cancelled}</Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="destructive">ناموفق</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReferralLink = () => {
    if (!referralCode) return referralLink;
    return referralLink;
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    
    hapticSelection();
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback for older browsers or Telegram WebApp
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        throw err;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (link) {
      const success = await copyToClipboard(link);
      if (success) {
        toast({
          title: "کپی شد",
          description: "لینک معرفی در حافظه کپی شد",
        });
      } else {
        toast({
          title: "خطا",
          description: "کپی انجام نشد",
          variant: "destructive",
        });
      }
    }
  };

  const copyReferralCode = async () => {
    if (referralCode) {
      const success = await copyToClipboard(referralCode);
      if (success) {
        toast({
          title: "کپی شد",
          description: "کد معرف کپی شد",
        });
      } else {
        toast({
          title: "خطا",
          description: "کپی انجام نشد",
          variant: "destructive",
        });
      }
    }
  };

  const shareReferralLink = () => {
    const link = getReferralLink();
    if (link && navigator.share) {
      navigator.share({
        title: t.wallet.shareReferralLink,
        text: t.wallet.useThisLinkToRegister,
        url: link,
      }).catch(console.error);
    } else {
      copyReferralLink();
    }
  };

  return (
    <ErrorBoundary>
    <div className={`min-h-screen bg-background pb-24 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <div className="p-6 pt-12 space-y-4 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Wallet className="h-8 w-8" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className={`text-2xl font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.title}</h1>
            <p className={`text-muted-foreground text-sm font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.title}</p>
          </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-check status indicator */}
            {autoCheckEnabled && pollingPendingTxs.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                <div className={`w-2 h-2 rounded-full ${isChecking ? 'bg-green-500 animate-pulse' : 'bg-green-500/50'}`} />
                <span className={`text-[10px] text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                  {pollingPendingTxs.length} {t.wallet.transactionPending}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={handleCheckPendingTransactions}
              disabled={isCheckingPending || isChecking}
              title={isChecking ? t.wallet.checkingNow : t.wallet.checkTransactions}
            >
              <RefreshCw size={18} className={isCheckingPending || isChecking ? "animate-spin" : ""} />
            </Button>
          </div>
        </motion.div>

        {/* Current Balance Card */}
        {!currentUser ? (
          <WalletBalanceSkeleton />
        ) : (
        <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none">
          <CardHeader className="pb-4">
            <CardDescription className={`text-primary-foreground/80 font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.balance}</CardDescription>
            <CardTitle className="text-3xl font-bold font-vazir text-left">
              $ {balance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          </Card>
        )}


        {/* Top Up Form */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className={`text-lg font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.topUp}</CardTitle>
            <CardDescription className={`font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.enterAmount}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <label className={`text-sm font-vazir block ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.paymentMethod}</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'telegram_stars' ? 'default' : 'outline'}
                  className={`font-vazir h-12 ${paymentMethod === 'telegram_stars' ? 'bg-primary' : ''}`}
                  onClick={() => setPaymentMethod('telegram_stars')}
                >
                  <Star className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t.wallet.telegramStars}
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'plisio' ? 'default' : 'outline'}
                  className={`font-vazir h-12 ${paymentMethod === 'plisio' ? 'bg-primary' : ''}`}
                  onClick={() => setPaymentMethod('plisio')}
                >
                  <Coins className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t.wallet.crypto}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Input
                type="number"
                placeholder={t.wallet.amount + " (USD)"}
                className="pl-10 text-left font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((val) => (
                <Button
                  key={val}
                  variant="secondary"
                  size="sm"
                  onClick={() => setAmount(val.toString())}
                  className="font-mono"
                >
                  {val}$
                </Button>
              ))}
            </div>

            <TelegramButton
              className={`w-full h-12 gap-2 mt-4 font-vazir ${isRTL ? '' : ''}`}
              onClick={handleTopUp}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                t.common.processing
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {paymentMethod === 'telegram_stars' ? t.wallet.telegramStars : t.wallet.crypto}
                </>
              )}
            </TelegramButton>
            <p className={`text-[10px] text-center text-muted-foreground mt-2 font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
              {paymentMethod === 'telegram_stars' 
                ? t.wallet.telegramStars 
                : t.wallet.crypto}
            </p>
          </CardContent>
        </Card>

        {/* Referral & Affiliate Card */}
        <Drawer open={isReferralOpen} onOpenChange={setIsReferralOpen}>
          <DrawerTrigger asChild>
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 cursor-pointer hover:bg-purple-500/15 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                      <Gift className="w-5 h-5" />
                    </div>
                    <CardTitle className={`text-lg font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.referralAndAffiliate}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className={`h-8 gap-1 text-xs ${isRTL ? 'flex-row-reverse' : ''}`} onClick={(e) => {
                    e.stopPropagation();
                    setIsReferralOpen(true);
                  }}>
                    <Share2 className="w-3 h-3" />
                    {t.wallet.view}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className={`text-xs text-muted-foreground font-vazir mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.totalReferrals}</p>
                    <p className="text-xl font-bold font-vazir">{referralStats.referralCount}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className={`text-xs text-muted-foreground font-vazir mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.totalCommissions}</p>
                    <p className="text-xl font-bold font-vazir text-green-500">
                      ${(referralStats.totalCommissions || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DrawerTrigger>
          <DrawerContent className={`max-w-lg mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
            <div className="p-6 pb-12">
              <DrawerHeader className="p-0 mb-6">
                <DrawerTitle className={`font-vazir text-xl ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.referralSystem}</DrawerTitle>
                <DrawerDescription className={`font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.wallet.inviteFriends} {t.wallet.commissionFromTransactions} 
                     <span className="px-2 font-bold text-foreground">{userCommissionRate.toFixed(0)}%</span>
                      {t.wallet.commissionReceived}
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-6">
                {/* Referral Code */}
                <div className="space-y-3">
                  <label className={`text-sm font-vazir block ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.yourReferralCode}</label>
                  <div className="relative">
                    <Input
                      value={referralCode || "---"}
                      readOnly
                      className="text-center font-mono text-lg font-bold tracking-wider bg-background cursor-pointer hover:bg-muted transition-colors"
                      dir="ltr"
                      onClick={copyReferralCode}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyReferralCode();
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Referral Link - Enhanced Design */}
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <label className={`text-sm font-bold font-vazir block ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.referralLink}</label>
                      <p className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.wallet.useThisLinkToRegister}
                      </p>
                    </div>
                  </div>
                  
                  {/* Link Display Card */}
                  <div className="relative group">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-foreground break-all select-all" dir="ltr">
                            {referralLink || t.wallet.loading}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 rounded-xl bg-white/10 hover:bg-white/20 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyReferralLink();
                          }}
                          title={t.wallet.copyLink}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className={`h-12 gap-2 rounded-xl border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                      onClick={copyReferralLink}
                    >
                      <Copy className="w-4 h-4" />
                      <span className="font-vazir font-semibold">{t.wallet.copyLink}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className={`h-12 gap-2 rounded-xl border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                      onClick={shareReferralLink}
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="font-vazir font-semibold">{t.wallet.shareLink}</span>
                    </Button>
                  </div>

                  {/* Info Badge */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className={`text-xs text-muted-foreground font-vazir leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                      💡 {t.wallet.inviteFriends} {t.wallet.commissionFromTransactions}
                      <span className="px-1.5 py-0.5 mx-1 rounded-md bg-primary/20 text-primary font-bold">
                        {userCommissionRate.toFixed(0)}%
                      </span>
                      {t.wallet.commissionReceived}
                    </p>
                  </div>
                </div>

                {/* Referral Stats */}
                {referralStatsLoading ? (
                  <div className={`text-center py-4 text-muted-foreground text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t.common.loading}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Users className="w-4 h-4 text-purple-500" />
                        <p className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.totalReferrals}</p>
                      </div>
                      <p className="text-2xl font-bold font-vazir">{referralStats.referralCount}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <p className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.totalCommissions}</p>
                      </div>
                      <p className="text-2xl font-bold font-vazir text-green-500">
                        ${(referralStats.totalCommissions || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Referred Users List */}
                {referralStatsData?.stats?.referredUsers && referralStatsData.stats.referredUsers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className={`text-sm font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.referredUsers} ({referralStatsData.stats.referredUsers.length})</h4>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {referralStatsData.stats.referredUsers.map((referredUser) => (
                          <div key={referredUser.id} className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 border ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <p className="text-sm font-bold font-vazir">
                                {referredUser.first_name} {referredUser.last_name || ''}
                              </p>
                              <p className="text-xs text-muted-foreground font-vazir">
                                @{referredUser.username || `user_${referredUser.id}`}
                              </p>
                              <p className={`text-[10px] text-muted-foreground font-vazir mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t.wallet.registrationDate} {new Date(referredUser.created_at).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US')}
                              </p>
                            </div>
                            <div className={isRTL ? 'text-right mr-3' : 'text-left ml-3'}>
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] mb-1">
                                {referredUser.transactionCount} {t.wallet.transaction}
                              </Badge>
                              <p className="text-xs font-bold font-vazir text-green-500">
                                ${referredUser.totalEarned.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Recent Commissions */}
                {referralStats.recentCommissions && referralStats.recentCommissions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className={`text-sm font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.recentCommissions}</h4>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {referralStats.recentCommissions.map((comm: any) => (
                          <div key={comm.id} className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 border ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <p className="text-sm font-bold font-vazir text-green-500">
                                +${(comm.commission_amount || 0).toFixed(2)}
                              </p>
                              <p className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                {comm.type === 'registration' ? t.wallet.registration : t.wallet.transaction}
                              </p>
                              {comm.referred_user_id && (
                                <p className={`text-[10px] text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                  {t.settings.user}: {comm.referred_user_id}
                                </p>
                              )}
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <p className={`text-[10px] text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                {new Date(comm.created_at).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US')}
                              </p>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
                                {comm.status === 'paid' ? t.wallet.paid : t.wallet.pending}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

              </div>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full mt-4">{t.common.close}</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Drawer open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="flex flex-col h-20 gap-2 border-dashed">
                <CreditCard className="w-5 h-5" />
                <span className={`text-xs font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.withdraw}</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className={`max-w-lg mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
              <div className="p-6 pb-12">
                <DrawerHeader className="p-0 mb-6">
                  <DrawerTitle className={`font-vazir text-xl ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.withdraw}</DrawerTitle>
                  <DrawerDescription className={`font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.withdrawWillBeProcessed}</DrawerDescription>
                </DrawerHeader>
                <div className="space-y-6 py-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-muted space-y-2">
                    <p className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.settings.walletAddress}:</p>
                    <p className="text-sm font-mono text-left break-all bg-background p-2 rounded border">
                      {walletAddress || t.settings.walletAddressNotSet}
                    </p>
                    {!walletAddress && (
                      <p className={`text-[10px] text-red-500 font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>⚠️ {t.settings.walletAddressNotSet}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <label className={`text-sm font-vazir block ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.withdrawAmount} (USD)</label>
                      <Input
                        type="number"
                        placeholder={t.wallet.amount + " (USD)"}
                        className="text-left font-mono h-12"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <p className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.withdrawableBalance}: ${balance}</p>
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <label className={`text-sm font-vazir block ${isRTL ? 'text-right' : 'text-left'}`}>{t.settings.passkeyLength}</label>
                      <Input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="----"
                        className="text-center tracking-[1em] text-lg font-bold h-12"
                        value={withdrawPasskey}
                        onChange={(e) => setWithdrawPasskey(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      />
                    </div>
                  </div>

                  <TelegramButton
                    className="w-full h-12 font-vazir text-lg"
                    onClick={handleWithdraw}
                    disabled={withdrawLoading || !walletAddress || !hasPasskey}
                  >
                    {withdrawLoading ? t.common.processing : t.common.confirm}
                  </TelegramButton>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="flex flex-col h-20 gap-2 border-dashed" onClick={() => refetchHistory()}>
                <History className="w-5 h-5" />
                <span className={`text-xs font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.history}</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className={`max-w-lg mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
              <div className="p-6 pb-12">
                <DrawerHeader className="p-0 mb-6">
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <DrawerTitle className={`font-vazir text-xl ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.transactions}</DrawerTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckPendingTransactions}
                      disabled={isCheckingPending || isChecking}
                      className={`h-8 px-3 text-xs font-vazir gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <RefreshCw size={14} className={(isCheckingPending || isChecking) ? "animate-spin" : ""} />
                      {(isCheckingPending || isChecking) ? t.wallet.checkingNow : t.wallet.checkTransactions}
                    </Button>
                  </div>
                  <DrawerDescription className={`font-vazir text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.wallet.recentTransactions}
                    {history.filter((tx: any) => tx.status === 'pending' && tx.type === 'deposit').length > 0 && (
                      <span className="block mt-1 text-xs">
                        {history.filter((tx: any) => tx.status === 'pending' && tx.type === 'deposit').length} {t.wallet.transactionPending}
                      </span>
                    )}
                    {autoCheckEnabled && pollingPendingTxs.length > 0 && (
                      <div className={`flex items-center gap-2 mt-2 text-[10px] ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isChecking ? 'bg-green-500 animate-pulse' : 'bg-green-500/50'}`} />
                        <span>
                          {t.wallet.autoChecking}
                          {lastCheckedAt && (
                            <span className={isRTL ? 'mr-1' : 'ml-1'}>
                              • {t.wallet.lastChecked}: {new Date(lastCheckedAt).toLocaleTimeString(isRTL ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </DrawerDescription>
                </DrawerHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4">
                    {historyLoading ? (
                      Array(3).fill(0).map((_, i) => <TransactionSkeleton key={i} />)
                    ) : history.length === 0 ? (
                      <div className={`text-center py-10 text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.wallet.noTransactions}</div>
                    ) : (
                      history.map((tx) => {
                        const isDeposit = tx.type === 'deposit';
                        const isWithdrawal = tx.type === 'withdrawal';
                        const isSubscription = tx.type === 'subscription' || tx.type === 'custom_subscription';
                        const isPositive = isDeposit;
                        const isNegative = isWithdrawal || isSubscription;
                        
                        const isBeingChecked = checkingTransactions.includes(tx.id);
                        return (
                        <div key={tx.id} className={`flex flex-col p-3 rounded-lg border bg-card gap-3 ${isBeingChecked ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
                          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <p className={`text-sm font-bold font-vazir ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive ? '+' : '-'}${tx.amount}
                              </p>
                                {isBeingChecked && (
                                  <RefreshCw size={12} className="text-primary animate-spin" />
                                )}
                              </div>
                              {getStatusBadge(tx.status)}
                            </div>
                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className={isRTL ? 'text-right' : 'text-left'}>
                                <p className={`text-sm font-semibold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                  {isDeposit ? t.wallet.topUp : isWithdrawal ? t.wallet.withdraw : isSubscription ? t.home.selectPlan : t.wallet.transaction}
                                </p>
                                <p className={`text-[10px] text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{new Date(tx.created_at).toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</p>
                              </div>
                              <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                                {isPositive ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                              </div>
                            </div>
                          </div>
                          
                          {/* Transaction IDs */}
                          <div className="flex flex-col gap-2 pt-2 border-t border-border">
                            <div
                              className={`flex items-center justify-between text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors active:scale-[0.98] ${isRTL ? 'flex-row-reverse' : ''}`}
                              onClick={() => {
                                copyToClipboard(tx.id);
                                toast({ title: t.common.copied, description: t.common.copied });
                              }}
                            >
                              <span className={`font-mono font-vazir flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Copy size={10} />
                                ID:
                              </span>
                              <span className="font-mono" dir="ltr">{tx.id}</span>
                            </div>
                            {tx.plisio_invoice_id && (
                              <div
                                className={`flex items-center justify-between text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors active:scale-[0.98] ${isRTL ? 'flex-row-reverse' : ''}`}
                                onClick={() => {
                                  copyToClipboard(tx.plisio_invoice_id);
                                  toast({ title: t.common.copied, description: t.common.copied });
                                }}
                              >
                                <span className={`font-mono font-vazir flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <Copy size={10} />
                                  Plisio:
                                </span>
                                <span className="font-mono" dir="ltr">{tx.plisio_invoice_id}</span>
                              </div>
                            )}
                            {tx.telegram_stars_order_id && (
                              <div
                                className={`flex items-center justify-between text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors active:scale-[0.98] ${isRTL ? 'flex-row-reverse' : ''}`}
                                onClick={() => {
                                  copyToClipboard(tx.telegram_stars_order_id);
                                  toast({ title: t.common.copied, description: t.common.copied });
                                }}
                              >
                                <span className={`font-mono font-vazir flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <Copy size={10} />
                                  Stars:
                                </span>
                                <span className="font-mono" dir="ltr">{tx.telegram_stars_order_id}</span>
                              </div>
                            )}
                          </div>
                          
                          {tx.type === 'withdrawal' && tx.status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full h-8 text-[10px] font-vazir bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none shadow-none"
                              onClick={() => handleCancelWithdrawal(tx.id)}
                              disabled={cancelLoading === tx.id}
                            >
                              {cancelLoading === tx.id ? t.common.processing : t.wallet.cancelWithdraw}
                            </Button>
                          )}
                        </div>
                      );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

      </div>
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
};

export default WalletPage;
