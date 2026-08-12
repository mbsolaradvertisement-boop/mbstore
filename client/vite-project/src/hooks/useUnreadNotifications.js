import { useCallback, useEffect, useState } from "react";
import {
  getCustomerNotifications,
  getSellerNotifications,
} from "../services/notificationService";

const loaders = {
  Customer: getCustomerNotifications,
  Seller: getSellerNotifications,
};

export default function useUnreadNotifications(role) {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    const load = loaders[role];
    if (!load) return;
    try {
      const { data } = await load({ page: 1, limit: 1 });
      setUnread(Number(data.unread || 0));
    } catch {
      // Navigation remains usable if the background count request fails.
    }
  }, [role]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    const onFocus = () => refresh();
    const onChanged = (event) => {
      if (event.detail?.role === role.toLowerCase()) {
        setUnread(Number(event.detail.unread || 0));
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("mb:notifications-changed", onChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mb:notifications-changed", onChanged);
    };
  }, [refresh, role]);

  return unread;
}
