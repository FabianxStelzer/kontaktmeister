export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PingPage() {
  console.log("[PING_PAGE] rendered @", new Date().toISOString());
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>pong</h1>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
