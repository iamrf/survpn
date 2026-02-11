import { useState, useEffect } from "react";
import { Download, RefreshCw, Copy, Check, Server, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import SubscriptionLinkCard from "@/components/SubscriptionLinkCard";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useSyncUserMutation } from "@/store/api";
import { getTelegramUser } from "@/lib/telegram";
import { getPlanInfo } from "@/lib/planUtils";
import { useGetPlansQuery } from "@/store/api";
import { setSubscriptionData } from "@/store/slices/index";

interface ServerConfig {
  id: string;
  config: string;
  type: string;
  name: string;
  server?: string;
}

const ConfigsPage = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const tgUser = getTelegramUser();
  const [syncUser] = useSyncUserMutation();
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);

  const currentUser = useAppSelector((state) => state.user.currentUser);
  const subscriptionData = useAppSelector((state) => state.user.subscriptionData);
  const { data: plansData } = useGetPlansQuery();
  const plans = plansData?.plans || [];

  // Update subscription data when user data changes
  useEffect(() => {
    if (currentUser?.subscriptionUrl && plans.length > 0) {
      const planInfo = getPlanInfo(currentUser.dataLimit || 0, currentUser.expire, plans);
      dispatch(setSubscriptionData({
        url: currentUser.subscriptionUrl,
        limit: currentUser.dataLimit || 0,
        used: currentUser.dataUsed || 0,
        expire: currentUser.expire,
        status: currentUser.status,
        username: currentUser.username,
        planName: planInfo.planName,
        isBonus: planInfo.isBonus
      }));
    }
  }, [currentUser, plans, dispatch]);

  // Load servers from subscription URL
  const loadServers = async () => {
    if (!subscriptionData?.url) return;
    
    setLoadingServers(true);
    try {
      const response = await fetch(subscriptionData.url);
      const configText = await response.text();
      
      // Split by newlines and filter empty lines
      const configLines = configText.split('\n').filter(line => line.trim().length > 0);
      
      const parsedServers: ServerConfig[] = configLines.map((line, index) => {
        const trimmed = line.trim();
        let type = 'unknown';
        let name = `سرور ${index + 1}`;
        let server = '';
        
        // Determine config type
        if (trimmed.startsWith('vmess://')) {
          type = 'vmess';
          try {
            const decoded = JSON.parse(atob(trimmed.replace('vmess://', '')));
            name = decoded.ps || decoded.name || `VMess ${index + 1}`;
            server = decoded.add || decoded.server || '';
          } catch (e) {
            name = `VMess ${index + 1}`;
          }
        } else if (trimmed.startsWith('vless://')) {
          type = 'vless';
          try {
            const url = new URL(trimmed);
            name = url.hash ? decodeURIComponent(url.hash.substring(1)) : `VLESS ${index + 1}`;
            server = url.hostname || '';
          } catch (e) {
            name = `VLESS ${index + 1}`;
          }
        } else if (trimmed.startsWith('trojan://')) {
          type = 'trojan';
          try {
            const url = new URL(trimmed);
            name = url.hash ? decodeURIComponent(url.hash.substring(1)) : `Trojan ${index + 1}`;
            server = url.hostname || '';
          } catch (e) {
            name = `Trojan ${index + 1}`;
          }
        } else if (trimmed.startsWith('ss://')) {
          type = 'shadowsocks';
          name = `Shadowsocks ${index + 1}`;
        } else if (trimmed.includes('proxies:') || trimmed.includes('Proxy:')) {
          type = 'clash';
          name = `Clash Config ${index + 1}`;
        } else {
          type = 'other';
          name = `سرور ${index + 1}`;
        }
        
        return {
          id: `server-${index}`,
          config: trimmed,
          type,
          name,
          server
        };
      });
      
      setServers(parsedServers);
    } catch (error) {
      console.error('Error loading servers:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری سرورها",
        variant: "destructive",
      });
    } finally {
      setLoadingServers(false);
    }
  };

  // Load servers when subscription data is available
  useEffect(() => {
    if (subscriptionData?.url) {
      loadServers();
    }
  }, [subscriptionData?.url]);

  const handleRefreshSubscription = async () => {
    if (!tgUser) return;
    setRefreshing('subscription');
    try {
      await syncUser(tgUser).unwrap();
      toast({
        title: "موفقیت",
        description: "اطلاعات اشتراک به‌روزرسانی شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی اطلاعات",
        variant: "destructive",
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleImportServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    setRefreshing(serverId);
    try {
      navigator.clipboard.writeText(server.config);
      setCopiedConfig(serverId);
      setTimeout(() => setCopiedConfig(null), 2000);
      
      toast({
        title: "کپی شد",
        description: `کانفیگ ${server.name} در حافظه کپی شد`,
      });
    } catch (error) {
      console.error('Error copying config:', error);
      toast({
        title: "خطا",
        description: "خطا در کپی کردن کانفیگ",
        variant: "destructive",
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleRefreshServers = async () => {
    await loadServers();
    toast({
      title: "موفقیت",
      description: "لیست سرورها به‌روزرسانی شد",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'vmess': 'VMess',
      'vless': 'VLESS',
      'trojan': 'Trojan',
      'shadowsocks': 'Shadowsocks',
      'clash': 'Clash',
      'other': 'سایر'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      'vmess': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' },
      'vless': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-500' },
      'trojan': { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-500' },
      'shadowsocks': { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-500' },
      'clash': { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-500' },
    };
    return colors[type] || { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-500' };
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-background" dir="rtl">
      <div className="p-6 pt-12 space-y-6 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Server className="h-8 w-8" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold font-vazir">اشتراک من</h1>
            <p className="text-muted-foreground text-sm font-vazir">لینک اشتراک و سرورهای VPN</p>
          </div>
        </motion.div>

        {/* Subscription Link Card */}
        {subscriptionData && subscriptionData.url ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-none bg-gradient-to-br from-primary/5 to-secondary/10 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold font-vazir">اطلاعات اشتراک</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={handleRefreshSubscription}
                    disabled={refreshing === 'subscription'}
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshing === 'subscription' ? 'animate-spin' : ''}`} />
                    به‌روزرسانی
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <SubscriptionLinkCard
                  url={subscriptionData.url}
                  dataLimit={subscriptionData.limit}
                  dataUsed={subscriptionData.used}
                  expire={subscriptionData.expire}
                  status={subscriptionData.status}
                  username={subscriptionData.username}
                  planName={subscriptionData.planName}
                  isBonus={subscriptionData.isBonus}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-muted">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground font-vazir mb-4">اشتراکی یافت نشد</p>
                <Button
                  onClick={handleRefreshSubscription}
                  disabled={refreshing === 'subscription'}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing === 'subscription' ? 'animate-spin' : ''}`} />
                  به‌روزرسانی اطلاعات
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Servers List */}
        {subscriptionData?.url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-vazir">سرورهای موجود</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {servers.length} سرور
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={handleRefreshServers}
                  disabled={loadingServers}
                >
                  <RefreshCw className={`w-3 h-3 ${loadingServers ? 'animate-spin' : ''}`} />
                  به‌روزرسانی
                </Button>
              </div>
            </div>

            {loadingServers ? (
              <div className="text-center py-8 text-muted-foreground font-vazir">
                در حال بارگذاری سرورها...
              </div>
            ) : servers.length === 0 ? (
              <Card className="border-muted">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground font-vazir">سروری یافت نشد</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={handleRefreshServers}
                  >
                    <RefreshCw className="w-4 h-4" />
                    تلاش مجدد
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {servers.map((server) => {
                  const typeColor = getTypeColor(server.type);
                  const isRefreshing = refreshing === server.id;
                  const isCopied = copiedConfig === server.id;

                  return (
                    <Card
                      key={server.id}
                      className={`border ${typeColor.border} ${typeColor.bg} hover:bg-opacity-20 transition-colors`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-xl ${typeColor.bg} ${typeColor.text} shrink-0`}>
                              <Server className="w-5 h-5" />
                            </div>
                            <div className="text-right flex-1 min-w-0">
                              <h3 className="font-bold font-vazir text-sm truncate">{server.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-[10px] ${typeColor.border} ${typeColor.text}`}>
                                  {getTypeLabel(server.type)}
                                </Badge>
                                {server.server && (
                                  <span className="text-xs text-muted-foreground font-mono truncate">
                                    {server.server}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 gap-2 text-xs"
                              onClick={() => handleImportServer(server.id)}
                              disabled={isRefreshing}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  کپی شد
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  کپی
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handleImportServer(server.id)}
                              disabled={isRefreshing}
                            >
                              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground font-vazir text-right leading-relaxed">
                💡 هر سرور را می‌توانید به صورت جداگانه کپی کرده و در اپلیکیشن VPN خود وارد کنید. 
                برای به‌روزرسانی لیست سرورها، دکمه به‌روزرسانی را بزنید.
              </p>
            </div>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default ConfigsPage;
