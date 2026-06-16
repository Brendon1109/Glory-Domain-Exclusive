import { MessageCircle, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WhatsappButtons({
  chatUrl,
  groupUrl,
}: {
  chatUrl?: string | null;
  groupUrl?: string | null;
}) {
  return (
    <div className="grid gap-2">
      {groupUrl ? (
        <a
          href={groupUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }), "w-full")}
        >
          <Users className="h-5 w-5" /> Join the WhatsApp group
        </a>
      ) : null}
      {chatUrl ? (
        <a
          href={chatUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        >
          <MessageCircle className="h-5 w-5" /> Message the pastor
        </a>
      ) : null}
    </div>
  );
}
