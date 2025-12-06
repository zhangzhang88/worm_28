export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030315",
        color: "#fff",
        textAlign: "center",
        padding: "2rem"
      }}
    >
      <div>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
      </div>
    </main>
  );
}
