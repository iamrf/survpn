import { Skeleton } from '@/components/ui/skeleton';

export const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex flex-col pb-24 bg-background relative z-0">
      <div className="mx-5 mt-5 space-y-6">
        <Skeleton className="h-24 w-full rounded-[2rem]" />
        <div className="px-5 space-y-12 mt-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
};
