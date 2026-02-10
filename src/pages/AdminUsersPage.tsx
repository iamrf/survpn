import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Search,
    RefreshCcw,
    ChevronRight,
    Users,
    ShieldCheck
} from "lucide-react";
import { getUsers } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const AdminUsersPage = () => {
    const [usersList, setUsersList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const navigate = useNavigate();

    const fetchAllUsers = async () => {
        setLoading(true);
        const result = await getUsers();
        if (result.success && result.users) {
            setUsersList(result.users);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const filteredUsers = usersList.filter(user =>
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id?.toString().includes(searchQuery)
    );

    return (
        <div className="min-h-screen flex flex-col pb-28 bg-background" dir="rtl">
            <div className="p-6 pt-12 max-w-lg mx-auto w-full">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white/5">
                            <ArrowLeft size={20} className="rotate-180" />
                        </Button>
                        <div className="text-right">
                            <h1 className="text-xl font-bold font-vazir">لیست کاربران</h1>
                            <p className="text-muted-foreground text-xs font-vazir">مدیریت و مشاهده کاربران سیستم</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAllUsers}
                        className={`p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${loading ? "animate-spin" : ""}`}
                    >
                        <RefreshCcw size={18} />
                    </button>
                </header>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="جستجوی کاربر یا آیدی..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors font-vazir text-right"
                        />
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="py-12 text-center text-muted-foreground text-sm font-vazir">در حال بارگذاری...</div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => navigate(`/admin/user/${user.id}`)}
                                    className="glass p-5 rounded-3xl border border-white/5 space-y-3 shadow-lg cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center justify-between text-right">
                                        <div className="flex items-center gap-3">
                                            {user.photo_url ? (
                                                <img src={user.photo_url} alt="" className="w-12 h-12 rounded-full border border-white/10" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                                    {user.first_name?.[0] || "?"}
                                                </div>
                                            )}
                                            <div className="text-right">
                                                <p className="font-bold text-sm font-vazir">{user.first_name} {user.last_name}</p>
                                                <p dir="ltr" className="text-[10px] text-muted-foreground">@{user.username || user.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right flex flex-col items-end gap-1">
                                                {user.role === 'admin' ? (
                                                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                                                        <ShieldCheck className="w-3 h-3 inline ml-1" />
                                                        مدیر
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-white/5 text-muted-foreground border-white/5 text-[10px] px-2 py-0.5">
                                                        <Users className="w-3 h-3 inline ml-1" />
                                                        کاربر
                                                    </Badge>
                                                )}
                                                <p className="text-[9px] text-muted-foreground font-vazir">
                                                    {new Date(user.last_seen).toLocaleDateString('fa-IR')}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className="text-muted-foreground rotate-180" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pt-2 border-t border-white/5">
                                        <span className="font-vazir">ID: {user.id}</span>
                                        <span className="font-mono">${user.balance?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-muted-foreground text-sm font-vazir bg-white/5 rounded-3xl border border-white/5 italic">
                                کاربری یافت نشد.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default AdminUsersPage;
