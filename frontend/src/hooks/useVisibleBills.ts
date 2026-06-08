import React from "react";
import { fetchVisibleBills } from "../services/api";
import { socket } from "../services/socket";
import { Bill } from "../types";

export const useVisibleBills = () => {
  const [bills, setBills] = React.useState<Bill[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [billsStatus, setBillsStatus] = React.useState("Loading bills");

  const fetchBills = React.useCallback(async () => {
    setIsLoading(true);
    const data = await fetchVisibleBills();
    setBills(data);
    setIsLoading(false);
    setBillsStatus(`${data.length} visible bills`);
  }, []);

  React.useEffect(() => {
    fetchBills().catch(() => {
      setIsLoading(false);
      setBillsStatus("Backend connection failed");
    });
  }, [fetchBills]);

  React.useEffect(() => {
    const refreshBills = () => {
      fetchBills().catch(() => {
        setBillsStatus("Could not refresh bills");
      });
    };

    socket.on("bill:generated", refreshBills);
    socket.on("bill:paid", refreshBills);

    return () => {
      socket.off("bill:generated", refreshBills);
      socket.off("bill:paid", refreshBills);
    };
  }, [fetchBills]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setBills((current) =>
        current.filter((bill) => {
          if (bill.paymentStatus !== "Paid" || !bill.paidAt) return true;
          return Date.now() - new Date(bill.paidAt).getTime() < 60_000;
        })
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return { bills, billsStatus, fetchBills, isLoading };
};
