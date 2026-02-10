import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export const SubscriptionPlanSkeleton = () => {
  return (
    <Card className="h-full overflow-hidden border-none bg-card/40 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex justify-between items-start">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
        <Skeleton className="h-8 w-32 mt-4" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </CardContent>
      <CardFooter>
        <Skeleton className="w-full h-12 rounded-2xl" />
      </CardFooter>
    </Card>
  );
};
