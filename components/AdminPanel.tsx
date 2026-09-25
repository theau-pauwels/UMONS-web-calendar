"use client";

import { FormEvent, useEffect, useState } from "react";

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCourses() {
    const response = await fetch("/api/admin/courses", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!response.ok) {
      setMessage("Impossible de charger les cours.");
      setAuthenticated(false);
      return;
    }
    const data = await response.json();
    setTitles(data.titles);
    setAliases(data.aliases || {});
    setAuthenticated(true);
  }

  useEffect(() => { loadCourses(); }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password")
      })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error || "Connexion impossible.");
      return;
    }
    await loadCourses();
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/aliases", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aliases })
    });
    setSaving(false);
    setMessage(response.ok ? "Modifications enregistrées." : "Enregistrement impossible.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setTitles([]);
  }

  if (authenticated === null) {
    return <main className="admin-shell"><p>Chargement…</p></main>;
  }

  if (!authenticated) {
    return (
      <main className="admin-shell">
        <section className="admin-login">
          <p className="eyebrow">Administration</p>
          <h1>Connexion</h1>
          <p>Accès réservé à l’administrateur du calendrier.</p>
          <form onSubmit={login}>
            <label>Utilisateur<input name="username" autoComplete="username" required /></label>
            <label>Mot de passe<input name="password" type="password" autoComplete="current-password" required /></label>
            <button type="submit">Se connecter</button>
          </form>
          {message && <p className="admin-message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="eyebrow">Administration</p><h1>Noms des cours</h1><p>Le nom original reste la clé. Le nom simplifié est affiché aux visiteurs.</p></div>
        <div className="admin-actions"><a href="/">Voir l’horaire</a><button onClick={logout}>Déconnexion</button></div>
      </header>

      <section className="admin-table">
        <div className="admin-row admin-row-head"><strong>Nom UMONS</strong><strong>Nom affiché</strong></div>
        {titles.map((title) => (
          <div className="admin-row" key={title}>
            <div className="source-title">{title}</div>
            <input
              value={aliases[title] || ""}
              placeholder={title}
              onChange={(event) => setAliases((current) => ({ ...current, [title]: event.target.value }))}
            />
          </div>
        ))}
      </section>
      <div className="admin-savebar">
        {message && <span>{message}</span>}
        <button onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </main>
  );
}
