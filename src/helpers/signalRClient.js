import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
    .withUrl(process.env.NEXT_PUBLIC_SIGNALR_HUB_URL) // Your SignalR hub URL
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

connection.onclose(async () => {
  console.log('SignalR connection closed. Reconnecting...');
  await startConnection();
});

const startConnection = async () => {
  try {
    await connection.start();
    console.log('SignalR connected.');
  } catch (err) {
    console.error('Error connecting to SignalR:', err);
    setTimeout(startConnection, 5000); // Retry connection after 5 seconds
  }
};

startConnection();

export default connection;