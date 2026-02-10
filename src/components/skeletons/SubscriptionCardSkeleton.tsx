import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const SubscriptionCardSkeleton = () => {
  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/5 to-secondary/10 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[2rem]">
      <CardHeader className="pb-4 text-right">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 space-y-6 text-right">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  );
};
