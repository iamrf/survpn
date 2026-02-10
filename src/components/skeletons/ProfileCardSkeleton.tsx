import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const ProfileCardSkeleton = () => {
  return (
    <Card className="mx-5 mt-5 rounded-[2rem] border-none bg-gradient-to-br from-primary/10 to-secondary/20 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
};
