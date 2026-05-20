const API_URL = import.meta.env.VITE_API_URL;

export function subscribeToTransactionStream(onTransaction) {
  if (typeof window === "undefined" || typeof EventSource === "undefined" || !API_URL) {
    return () => {};
  }

  const eventSource = new EventSource(`${API_URL}/api/transactions/stream`);

  const handleTransaction = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (typeof onTransaction === "function") {
        onTransaction(payload);
      }
    } catch (error) {
      console.error("Error parsing streamed transaction:", error);
    }
  };

  eventSource.addEventListener("new-transaction", handleTransaction);
  eventSource.onerror = (error) => {
    console.error("Transaction stream error:", error);
  };

  return () => {
    eventSource.removeEventListener("new-transaction", handleTransaction);
    eventSource.close();
  };
}
