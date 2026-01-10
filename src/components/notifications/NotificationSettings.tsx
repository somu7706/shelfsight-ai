import { Bell, BellOff, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              isSubscribed ? "bg-success/10" : "bg-muted"
            )}>
              <Bell className={cn(
                "h-5 w-5",
                isSubscribed ? "text-success" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg">Push Notifications</CardTitle>
              <CardDescription>
                Get instant alerts when new orders arrive
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {permission === "denied" && (
              <Badge variant="destructive">Blocked</Badge>
            )}
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading || permission === "denied"}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                How it works
              </p>
              <ul className="space-y-1">
                <li>• Receive alerts even when the app is closed</li>
                <li>• Get notified instantly when new orders come in</li>
                <li>• Never miss an important update from your store</li>
              </ul>
            </div>
          </div>

          {permission === "denied" && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-sm text-danger">
                Notifications are blocked. Please enable them in your browser settings:
              </p>
              <ol className="text-sm text-danger/80 mt-2 ml-4 list-decimal">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Find "Notifications" and set it to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          )}

          <Button
            onClick={handleToggle}
            disabled={isLoading || permission === "denied"}
            className={cn(
              "w-full",
              isSubscribed ? "bg-muted text-foreground hover:bg-muted/80" : "gradient-primary"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isSubscribed ? "Disabling..." : "Enabling..."}
              </>
            ) : isSubscribed ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Disable Notifications
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}