import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

export const getNotificationConnection = (): signalR.HubConnection => {
    if(!connection){
        connection = new signalR.HubConnectionBuilder()
        .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/hubs/notification`, {
            accessTokenFactory: () => {
                if(typeof window === "undefined") return "";
                return localStorage.getItem("token") ?? "";
            },
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();
    }
    return connection;
};

export const startNotificationConnection = async (): Promise<void> => {
    const conn = getNotificationConnection();
    if(conn.state === signalR.HubConnectionState.Disconnected){
        await conn.start();
    }
}

export const stopNotificationConnection = async (): Promise<void> => {
    if(connection?.state === signalR.HubConnectionState.Connected){
        await connection.stop();
        connection = null;
    }
};