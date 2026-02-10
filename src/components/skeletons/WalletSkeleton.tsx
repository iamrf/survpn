import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const WalletBalanceSkeleton = () => {
  return (
    <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none">
      <CardHeader className="pb-4">
        <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
        <Skeleton className="h-10 w-32 mt-2 bg-primary-foreground/20" />
      </CardHeader>
    </Card>
  );
};

export const TransactionSkeleton = () => {
  return (
    <div className="flex flex-col p-3 rounded-lg border bg-card gap-3">
      <div className="flex items-center justify-between">
        <div className="text-left space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
};
