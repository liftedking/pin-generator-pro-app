export default function PrivacyPolicy() {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#0f0f0f",
      color: "#e5e5e5",
      minHeight: "100vh",
      padding: "40px 20px",
      lineHeight: 1.7,
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Pin Generator Pro
        </h1>
        <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 32 }}>
          Last updated: June 2026
        </p>
        <span style={{
          display: "inline-block", background: "#e60023", color: "#fff",
          fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px",
          borderRadius: 20, marginBottom: 32,
        }}>
          Privacy Policy
        </span>

        <h2 style={{ color: "#fff", marginBottom: 8, marginTop: 28 }}>1. Overview</h2>
        <p style={{ color: "#aaa", marginBottom: 12 }}>
          Pin Generator Pro is a personal Pinterest scheduling tool intended for personal use only.
        </p>

        <h2 style={{ color: "#fff", marginBottom: 8, marginTop: 28 }}>2. Information We Access</h2>
        <p style={{ color: "#aaa", marginBottom: 12 }}>
          This app connects to your Pinterest account via Pinterest's official OAuth system.
          We access your Pinterest boards and pins solely to publish content on your behalf
          at scheduled times you define.
        </p>

        <h2 style={{ color: "#fff", marginBottom: 8, marginTop: 28 }}>3. Data Storage</h2>
        <p style={{ color: "#aaa", marginBottom: 12 }}>
          Pin images and scheduling data are stored temporarily until published to Pinterest,
          after which they are deleted. No personal data is sold or shared with third parties.
        </p>

        <h2 style={{ color: "#fff", marginBottom: 8, marginTop: 28 }}>4. Third Party Services</h2>
        <p style={{ color: "#aaa", marginBottom: 12 }}>
          This app uses Pinterest API, Pexels, and Hugging Face. Each is governed by their
          own privacy policies.
        </p>

        <h2 style={{ color: "#fff", marginBottom: 8, marginTop: 28 }}>5. Contact</h2>
        <p style={{ color: "#aaa" }}>
          This is a personal project. Visit the app at{" "}
          <a href="https://pin-generator-pro-app-vc2t.vercel.app" style={{ color: "#e60023" }}>
            pin-generator-pro-app-vc2t.vercel.app
          </a>
        </p>
      </div>
    </div>
  );
}
