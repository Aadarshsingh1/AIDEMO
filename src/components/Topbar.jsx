export default function Topbar({ title, subtitle }) {
  if (!title && !subtitle) return null;
  return (
    <header className="topbar">
      <div className="topbar-left">
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
