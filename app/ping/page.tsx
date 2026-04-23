export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PingPage() {
  return (
    <html lang="de">
      <body>
        <h1>pong</h1>
        <p>Time: {new Date().toISOString()}</p>
      </body>
    </html>
  );
}
