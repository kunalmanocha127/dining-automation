import React from "react";
import { fetchMenuItems } from "../services/api";
import { socket } from "../services/socket";
import { MenuItem } from "../types";

export const useLiveMenu = () => {
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusText, setStatusText] = React.useState("Loading menu");

  const fetchMenu = React.useCallback(async () => {
    setIsLoading(true);
    const data = await fetchMenuItems();
    setItems(data);
    setIsLoading(false);
    setStatusText(`${data.length} menu items loaded`);
  }, []);

  React.useEffect(() => {
    fetchMenu().catch(() => {
      setIsLoading(false);
      setStatusText("Backend connection failed");
    });
  }, [fetchMenu]);

  React.useEffect(() => {
    socket.on("menu:item-created", (item: MenuItem) => {
      setItems((current) => [...current, item]);
    });

    socket.on("menu:item-updated", (item: MenuItem) => {
      setItems((current) => current.map((currentItem) => (currentItem._id === item._id ? item : currentItem)));
    });

    socket.on("menu:availability-changed", (payload: { itemId: string; isAvailable: boolean }) => {
      setItems((current) =>
        current.map((item) => (item._id === payload.itemId ? { ...item, isAvailable: payload.isAvailable } : item))
      );
    });

    socket.on("menu:item-deleted", (payload: { itemId: string }) => {
      setItems((current) => current.filter((item) => item._id !== payload.itemId));
    });

    return () => {
      socket.off("menu:item-created");
      socket.off("menu:item-updated");
      socket.off("menu:availability-changed");
      socket.off("menu:item-deleted");
    };
  }, []);

  const sortedItems = React.useMemo(
    () => [...items].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [items]
  );

  const groupedItems = React.useMemo(() => {
    return sortedItems.reduce<Record<string, MenuItem[]>>((groups, item) => {
      groups[item.category] = [...(groups[item.category] ?? []), item];
      return groups;
    }, {});
  }, [sortedItems]);

  return { fetchMenu, groupedItems, isLoading, items, setStatusText, statusText };
};
