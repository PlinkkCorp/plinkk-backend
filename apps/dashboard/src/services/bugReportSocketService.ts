export const bugReportClients = new Map<string, Set<any>>();

export type ThreadMessage = {
    id: string;
    from: "user" | "admin";
    message: string;
    userName: string;
    image: string | null;
    createdAt: Date;
};

export function broadcastToBugReport(id: string, message: ThreadMessage) {
    const clients = bugReportClients.get(id);
    if (clients) {
        const payload = JSON.stringify({ type: 'message', data: message });
        for (const client of clients) {
            try {
                const s = client.socket || client;
                if (s && s.readyState === 1) { // 1 = OPEN
                    s.send(payload);
                }
            } catch (e) {
                // Ignore send errors for individual clients
            }
        }
    }
}
