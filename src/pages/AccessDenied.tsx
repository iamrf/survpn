import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTelegramBotUsername } from "@/lib/telegram";

const AccessDenied = () => {
  const botUsername = getTelegramBotUsername();
  const botLink = `https://t.me/${botUsername}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">دسترسی محدود</CardTitle>
          <CardDescription className="mt-2">
            این برنامه فقط از طریق ربات تلگرام قابل دسترسی است
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              برای استفاده از این برنامه، لطفاً از طریق ربات تلگرام زیر وارد شوید:
            </p>
            <div className="flex items-center justify-center">
              <a
                href={botLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                @{botUsername}
              </a>
            </div>
          </div>
          <Button
            asChild
            className="w-full"
            size="lg"
          >
            <a href={botLink} target="_blank" rel="noopener noreferrer">
              باز کردن ربات تلگرام
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
