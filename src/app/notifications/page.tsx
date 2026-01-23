import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NotificationList } from "@/components/NotificationList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/notifications");
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientId: user.id },
    include: {
      actor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <MarkAllReadButton />
      </div>

      <NotificationList notifications={notifications} />
    </div>
  );
}

function MarkAllReadButton() {
  return (
    <form
      action={async () => {
        "use server";
        const user = await getCurrentUser();
        if (user) {
          await prisma.notification.updateMany({
            where: { recipientId: user.id, isRead: false },
            data: { isRead: true },
          });
        }
      }}
    >
      <button type="submit" className="btn-secondary text-sm">
        Mark all as read
      </button>
    </form>
  );
}

