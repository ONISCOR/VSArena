import type { Locale } from "@/lib/i18n/locale";
import type { LegalDocument } from "@/lib/legal/types";

const it: LegalDocument = {
  kicker: "Cookie",
  title: "Informativa sui cookie e sulla memorizzazione locale",
  updatedLine: "Ultimo aggiornamento: {updatedIt}. VSArena V1.",
  intro: [
    "Questa pagina descrive i cookie e lo storage usati su VSArena, ai sensi dell’art. 122 del D.lgs. 196/2003 (Codice Privacy), delle Linee guida cookie del Garante e del GDPR.",
    "Il titolare è {controller}, persona fisica identificata con questo pseudonimo, che gestisce il progetto open source VSArena. {org} è il nome del laboratorio e dell’organizzazione GitHub: non è una società costituita. Contatto: {email}. Repository: {github}.",
    "Usiamo solo memorizzazione tecnica necessaria al funzionamento del servizio. Non installiamo cookie di profilazione, di pubblicità, di analytics di terze parti, pixel o tracciamento cross-sito. Per questo non mostriamo un banner di consenso: l’art. 122 Codice Privacy e le Linee guida del Garante non lo richiedono quando i cookie sono strettamente necessari.",
  ],
  sections: [
    {
      title: "1. Cosa usiamo",
      blocks: [
        {
          ul: [
            "vsarena-locale (cookie di prima parte): ricorda se l’interfaccia è in italiano o in inglese. Durata 12 mesi (SameSite=Lax). Base: art. 122 Codice Privacy — cookie tecnico per una scelta dell’utente.",
            "Cookie di sessione Supabase Auth (di norma nomi che iniziano con sb-): ti riconoscono dopo il login con GitHub. Durata pari alla sessione. Necessari all’account, alla chiave API e alle partite ufficiali. Si cancellano con Esci o dalle impostazioni del browser.",
            "localStorage vsarena-theme-v1: tema chiaro o scuro. Resta sul tuo dispositivo; non lo inviamo a reti pubblicitarie.",
            "localStorage vsarena-sidebar-v1: se il menu laterale è aperto o chiuso.",
            "localStorage vsarena-submit-guide: se hai scelto la guida neofita o researcher in Invio.",
          ],
        },
        {
          p: "Playground e Studio, nel tab, tengono pose e telemetria in memoria di pagina. Non sono cookie. Non scrivono ELO pubblico. Una demo registrata in Studio viene scaricata come file sul tuo computer: non la carichiamo noi, a meno che tu non la invii altrove.",
        },
      ],
    },
    {
      title: "2. Cosa non usiamo",
      blocks: [
        {
          ul: [
            "Cookie di profilazione, remarketing o pubblicità.",
            "Strumenti di misurazione di terze parti (nessun Google Analytics, Meta Pixel, Hotjar o simili).",
            "Fingerprint intenzionale a fini di marketing.",
          ],
        },
      ],
    },
    {
      title: "3. Come disattivarli",
      blocks: [
        {
          p: "Puoi cancellare cookie e dati del sito dalle impostazioni del browser. Dopo, la lingua torna al valore predefinito, il tema si resetta e, se eri connesso, dovrai rifare il login GitHub. Il servizio resta usabile (Playground e Studio in locale) anche senza cookie di sessione.",
        },
      ],
    },
    {
      title: "4. Aggiornamenti",
      blocks: [
        {
          p: "Se in futuro aggiungessimo storage non tecnico (per esempio analitica di misurazione), aggiorneremo questa pagina e, se dovuto, chiederemo il consenso prima di installarlo. Per domande: {email}. Informativa privacy: /privacy. Termini: /terms.",
        },
      ],
    },
  ],
};

const en: LegalDocument = {
  kicker: "Cookies",
  title: "Cookie and local-storage notice",
  updatedLine: "Last updated: {updatedEn}. VSArena V1.",
  intro: [
    "This page describes the cookies and storage used on VSArena, under Article 122 of Italian Legislative Decree 196/2003 (Privacy Code), the Garante’s cookie guidelines, and the GDPR.",
    "The controller is {controller}, a natural person identified by this pseudonym, who runs the VSArena open-source project. {org} is the lab name and the GitHub organization: it is not an incorporated company. Contact: {email}. Repository: {github}.",
    "We only use technical storage needed to run the service. We do not set profiling, advertising or third-party analytics cookies, pixels or cross-site trackers. We therefore do not show a consent banner: Italian Privacy Code Article 122 and the Garante’s guidance do not require one when cookies are strictly necessary.",
  ],
  sections: [
    {
      title: "1. What we use",
      blocks: [
        {
          ul: [
            "vsarena-locale (first-party cookie): remembers Italian or English. 12 months (SameSite=Lax). Legal basis: Privacy Code Article 122 — a technical cookie for a choice you made.",
            "Supabase Auth session cookies (names usually starting with sb-): recognise you after GitHub login. Last as long as the session. Needed for the account, API key and official matches. Cleared on Sign out or in the browser.",
            "localStorage vsarena-theme-v1: light or dark theme. Stays on your device; we do not send it to ad networks.",
            "localStorage vsarena-sidebar-v1: whether the side menu is open.",
            "localStorage vsarena-submit-guide: beginner vs researcher on Submit.",
          ],
        },
        {
          p: "Playground and Studio keep poses and telemetry in page memory. Those are not cookies. They do not write public ELO. A demo recorded in Studio is downloaded as a file on your computer: we do not upload it unless you send it somewhere else.",
        },
      ],
    },
    {
      title: "2. What we do not use",
      blocks: [
        {
          ul: [
            "Profiling, remarketing or advertising cookies.",
            "Third-party analytics (no Google Analytics, Meta Pixel, Hotjar or similar).",
            "Intentional fingerprinting for marketing.",
          ],
        },
      ],
    },
    {
      title: "3. How to turn them off",
      blocks: [
        {
          p: "You can delete cookies and site data in the browser. Language and theme then reset, and you will need to sign in with GitHub again. Playground and local Studio still work without a session cookie.",
        },
      ],
    },
    {
      title: "4. Updates",
      blocks: [
        {
          p: "If we later add non-technical storage (for example audience analytics), we will update this page and collect consent first where the law requires it. Questions: {email}. Privacy notice: /privacy. Terms: /terms.",
        },
      ],
    },
  ],
};

/**
 * Cookie notice for the active locale.
 */
export function cookiesDocument(locale: Locale): LegalDocument {
  return locale === "it" ? it : en;
}
