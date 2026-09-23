"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { AgentMark } from "@/components/gamification/AgentMark";
import { Button } from "@/components/ui/button";
import { agentSlug } from "@/lib/matches/memory";
import {
  AGENT_ACCENTS,
  AGENT_AVATARS,
  parseAccent,
  parseAvatar,
  type AgentAccent,
  type AgentAvatar,
} from "@/lib/gamification/identity";

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  elo_rating: number;
  tagline?: string | null;
  accent?: string;
  avatar_id?: string;
}

interface AccountPanelProps {
  username: string;
  apiKey: string;
  agents: AgentRow[];
  embedded?: boolean;
  mode?: "all" | "key" | "agents";
}

const fieldClass =
  "mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--lift)] px-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--cyan)]";

/**
 * Reveal/copy/rotate API key and register an agent for the leaderboard.
 */
export function AccountPanel({ apiKey, agents, embedded = false, mode = "all" }: AccountPanelProps) {
  const { m } = useI18n();
  const [key, setKey] = useState(apiKey);
  const [shown, setShown] = useState(false);
  const [freshKey, setFreshKey] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"rotate" | "create" | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; at: "key" | "register" | "look"; text: string } | null>(
    null,
  );
  const [mine, setMine] = useState(agents);
  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [openLook, setOpenLook] = useState<string | null>(agents[0]?.id ?? null);

  const masked = key.length > 12 ? `${key.slice(0, 8)}…${key.slice(-4)}` : "—";
  const hasAgents = mine.length > 0;

  useEffect(() => {
    if (!freshKey) return;
    const timer = window.setTimeout(() => {
      setShown(false);
      setFreshKey(false);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [freshKey]);

  async function rotate() {
    setBusy("rotate");
    setNotice(null);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate" }),
      });
      const json = (await res.json()) as { api_key?: string; error?: string };
      if (!res.ok || !json.api_key) throw new Error(json.error ?? "rotate failed");
      setKey(json.api_key);
      setShown(true);
      setFreshKey(true);
      setConfirmRotate(false);
    } catch {
      setNotice({ kind: "err", at: "key", text: m.account.failRotate });
    } finally {
      setBusy(null);
    }
  }

  async function createAgent() {
    setBusy("create");
    setNotice(null);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-agent", name, repo_url: repo }),
      });
      const json = (await res.json()) as { agent?: AgentRow; error?: string };
      if (!res.ok || !json.agent) throw new Error(json.error ?? "create failed");
      setMine((rows) => [json.agent as AgentRow, ...rows]);
      setOpenLook(json.agent.id);
      setName("");
      setRepo("");
      setNotice({ kind: "ok", at: "register", text: m.account.created });
    } catch {
      setNotice({ kind: "err", at: "register", text: m.account.failCreate });
    } finally {
      setBusy(null);
    }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      if (freshKey) {
        setShown(false);
        setFreshKey(false);
      }
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice({ kind: "err", at: "key", text: m.account.failGeneric });
    }
  }

  const showKey = mode === "all" || mode === "key";
  const showAgents = mode === "all" || mode === "agents";

  return (
    <div className="space-y-5">
      {showKey ? (
      <section className="panel p-6">
        <StepHead embedded={embedded} n={m.account.step1} title={m.account.apiKey} body={m.account.apiHelp} />
        {freshKey ? (
          <p className="mt-4 rounded-xl border border-arena-cyan/30 bg-arena-cyan/10 px-4 py-3 text-sm leading-6 text-white">
            {m.account.rotatedBanner}
          </p>
        ) : null}
        <div className="mt-5 rounded-xl border border-white/10 bg-black/45 px-4 py-4">
          <p className="break-all font-mono text-[13px] leading-6 text-white">{shown ? key : masked}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" disabled={!key} onClick={() => void copyKey()}>
              {copied ? m.account.copied : m.account.copy}
            </Button>
            <Button size="sm" variant="outline" disabled={!key || freshKey} onClick={() => setShown((v) => !v)}>
              {shown ? m.account.hide : m.account.reveal}
            </Button>
            {confirmRotate ? (
              <>
                <Button size="sm" variant="outline" disabled={busy === "rotate"} onClick={() => void rotate()}>
                  {m.account.rotateYes}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy === "rotate"} onClick={() => setConfirmRotate(false)}>
                  {m.account.rotateNo}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" disabled={busy === "rotate"} onClick={() => setConfirmRotate(true)}>
                {m.account.rotate}
              </Button>
            )}
          </div>
        </div>
        {confirmRotate ? <p className="mt-3 text-xs leading-5 text-arena-orange">{m.account.rotateConfirm}</p> : null}
        <p className="mt-3 font-mono text-[11px] text-arena-muted">{m.account.apiCode}</p>
        <p className="mt-1 text-xs leading-5 text-arena-muted">{m.account.rotateHint}</p>
        <Notice notice={notice} at="key" />
      </section>
      ) : null}

      {showAgents ? (
      <>
      <section className="panel p-6">
        <StepHead embedded={embedded} n={m.account.step2} title={m.account.register} body={m.account.registerHelp} />
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-xs text-arena-muted">{m.account.nameLabel}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={m.account.namePlaceholder}
              autoComplete="off"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-xs text-arena-muted">{m.account.repoLabel}</span>
            <input
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder={m.account.repoPlaceholder}
              inputMode="url"
              autoComplete="off"
              className={`${fieldClass} font-mono text-[13px]`}
            />
            <span className="mt-1.5 block text-xs leading-5 text-arena-muted">{m.account.repoHint}</span>
          </label>
          <Button
            variant={hasAgents ? "outline" : "default"}
            size={hasAgents ? "sm" : "default"}
            disabled={busy === "create" || name.trim().length < 2}
            onClick={() => void createAgent()}
          >
            {m.account.create}
          </Button>
        </div>
        <Notice notice={notice} at="register" />
      </section>

      <section className="panel p-6">
        <StepHead embedded={embedded} n={m.account.step3} title={m.account.look} body={m.account.lookHelp} />
        {mine.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-5 text-sm leading-6 text-arena-muted">
            {m.account.emptyAgents}
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {mine.map((agent) => (
              <AgentLookCard
                key={agent.id}
                agent={agent}
                expanded={openLook === agent.id}
                onToggle={() => setOpenLook((id) => (id === agent.id ? null : agent.id))}
                onError={(text) => setNotice({ kind: "err", at: "look", text })}
                onSaved={(next) => {
                  setMine((rows) => rows.map((row) => (row.id === next.id ? { ...row, ...next } : row)));
                  setNotice({ kind: "ok", at: "look", text: m.account.saved });
                }}
              />
            ))}
          </div>
        )}
        <Notice notice={notice} at="look" />
      </section>
      </>
      ) : null}
    </div>
  );
}

function Notice({
  notice,
  at,
}: {
  notice: { kind: "ok" | "err"; at: string; text: string } | null;
  at: string;
}) {
  if (!notice || notice.at !== at) return null;
  return (
    <p className={`mt-3 text-sm leading-6 ${notice.kind === "ok" ? "text-arena-cyan" : "text-red-400"}`}>
      {notice.text}
    </p>
  );
}

function StepHead({
  n,
  title,
  body,
  embedded,
}: {
  n: string;
  title: string;
  body: string;
  embedded: boolean;
}) {
  if (embedded) {
    return (
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-arena-muted">{body}</p>
      </div>
    );
  }
  return (
    <div className="flex gap-4">
      <span className="mt-1 font-mono text-[11px] tracking-[0.16em] text-arena-cyan">{n}</span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-arena-muted">{body}</p>
      </div>
    </div>
  );
}

function AgentLookCard({
  agent,
  expanded,
  onToggle,
  onError,
  onSaved,
}: {
  agent: AgentRow;
  expanded: boolean;
  onToggle: () => void;
  onError: (message: string) => void;
  onSaved: (agent: AgentRow) => void;
}) {
  const { m } = useI18n();
  const [tagline, setTagline] = useState(agent.tagline ?? "");
  const [accent, setAccent] = useState<AgentAccent>(parseAccent(agent.accent));
  const [avatar, setAvatar] = useState<AgentAvatar>(parseAvatar(agent.avatar_id));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-agent",
          id: agent.id,
          tagline,
          accent,
          avatar_id: avatar,
        }),
      });
      const json = (await res.json()) as { agent?: AgentRow; error?: string };
      if (!res.ok || !json.agent) throw new Error(json.error ?? "save failed");
      onSaved(json.agent);
    } catch {
      onError(m.account.failSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <AgentMark avatar={avatar} accent={accent} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{agent.name}</p>
            <p className="font-mono text-[11px] text-arena-muted">
              ELO {agent.elo_rating}
              {tagline.trim() ? ` · ${tagline.trim()}` : ""}
            </p>
          </div>
        </button>
        <button type="button" onClick={onToggle} className="text-xs text-arena-muted hover:text-white">
          {expanded ? m.account.collapseLook : m.account.editLook}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-arena-muted">{m.account.publicPreview}</p>
            <div className="mt-3 flex items-center gap-3">
              <AgentMark avatar={avatar} accent={accent} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{agent.name}</p>
                {tagline.trim() ? <p className="truncate text-xs text-arena-muted">{tagline.trim()}</p> : null}
                <p className="font-mono text-[11px] text-arena-muted">ELO {agent.elo_rating}</p>
              </div>
            </div>
          </div>

          <Button asChild size="sm" variant="outline">
            <Link href={`/leaderboard/${agentSlug(agent.name)}`}>{m.account.openProfile}</Link>
          </Button>

          <label className="block">
            <span className="text-xs text-arena-muted">{m.account.tagline}</span>
            <input
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              placeholder={m.account.taglinePlaceholder}
              maxLength={80}
              className={fieldClass}
            />
          </label>
          <fieldset>
            <legend className="text-xs text-arena-muted">{m.account.avatar}</legend>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {AGENT_AVATARS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAvatar(id)}
                  className={`rounded-lg border p-1 ${avatar === id ? "border-white/50" : "border-white/10"}`}
                  aria-label={id}
                >
                  <AgentMark avatar={id} accent={accent} size="sm" />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xs text-arena-muted">{m.account.accent}</legend>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {AGENT_ACCENTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAccent(id)}
                  className={`h-7 w-7 rounded-full border ${accent === id ? "border-white" : "border-white/20"}`}
                  style={{
                    background:
                      id === "cyan" ? "#00AEEF" : id === "orange" ? "#F7941E" : id === "magenta" ? "#E11D8F" : "#e8edf4",
                  }}
                  aria-label={id}
                />
              ))}
            </div>
          </fieldset>
          <Button size="sm" variant="outline" disabled={saving} onClick={() => void save()}>
            {m.account.saveLook}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
