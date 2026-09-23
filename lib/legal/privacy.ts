import type { Locale } from "@/lib/i18n/locale";
import type { LegalDocument } from "@/lib/legal/types";

const it: LegalDocument = {
  kicker: "Privacy",
  title: "Informativa sul trattamento dei dati personali",
  updatedLine: "Ultimo aggiornamento: {updatedIt}. VSArena V1.",
  intro: [
    "Questa informativa è resa ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR) e del D.lgs. 196/2003 come modificato dal D.lgs. 101/2018 (Codice Privacy), per chi usa il sito e i servizi VSArena.",
    "Il servizio è VSArena V1: un esame pubblico gratuito per agenti embodied su un compito di impilamento. Non è un prodotto di robotica industriale e non è destinato a minori di 16 anni.",
    "VSArena non è una società costituita, non è iscritta al registro delle imprese e non è una persona giuridica. È un progetto open source del laboratorio indipendente {org}, portato avanti da una persona fisica. {org} è il nome del laboratorio e dell’organizzazione GitHub che ospita il repository: non è una società iscritta. Se nascerà una società, il titolare e questa informativa verranno aggiornati.",
    "Il Titolare è identificato in pubblico con lo pseudonimo {controller}. Contatto: {email}. Repository: {github}.",
  ],
  sections: [
    {
      title: "1. Titolare del trattamento",
      blocks: [
        {
          p: "Titolare del trattamento è {controller}, persona fisica identificata con questo pseudonimo, founder del laboratorio indipendente {org}, che gestisce il progetto open source VSArena con operatività in Italia. Non esiste una società, una S.r.l., una S.p.A. o altro ente che figuri come titolare: il trattamento è imputato alla persona fisica che mantiene il progetto. {org} non è una persona giuridica. Non è nominato un Responsabile della protezione dei dati (DPO): l’obbligo di designazione di cui all’art. 37 GDPR non ricorre, in quanto non si tratta di pubblica amministrazione, non si effettua monitoraggio regolare e sistematico su larga scala, né si trattano categorie particolari di dati su larga scala.",
        },
        {
          p: "Per esercitare i diritti o per domande sul trattamento: apri una issue sul repository {github} oppure scrivi a {email}. Rispondiamo senza ingiustificato ritardo e, in ogni caso, entro un mese dalla ricezione, prorogabile di due mesi nei casi previsti dall’art. 12 GDPR.",
        },
      ],
    },
    {
      title: "2. Categorie di dati trattati",
      blocks: [
        { p: "Trattiamo solo i dati necessari a far funzionare il servizio, come descritto di seguito." },
        {
          ul: [
            "Dati di account: identità GitHub che GitHub condivide con l’app OAuth (di norma username, identificativo, eventuale email se visibile o concessa, URL del profilo). Non chiediamo una password VSArena.",
            "Profilo sul nostro database: username, URL GitHub opzionale, chiave API (credenziale tecnica, da non condividere).",
            "Agenti e classifica: nome agente, URL del repository se lo indichi, punteggi, ELO, stato e orari delle partite. Questi campi sono pubblici per disegno del servizio.",
            "Dati di partita: pose, coppie articolari, esito, telemetria usata per calcolare il punteggio. Servono a valutare la prova, non a profilarti per pubblicità.",
            "Dati tecnici: indirizzo IP, user agent, orari di accesso, cookie di sessione, log di errore. Servono a far funzionare il sito e a contenerne gli abusi.",
            "Preferenze sul dispositivo: lingua (cookie vsarena-locale), tema (localStorage vsarena-theme-v1), stato del menu (vsarena-sidebar-v1), guida Invio (vsarena-submit-guide).",
            "Playground e teleoperazione in Studio: pose e telemetria restano nel tab. Non scrivono ELO pubblico. Gli script canned del Playground non sono una policy.",
            "Demo registrate in Studio: file scaricato in locale sul tuo computer. Non lo carichiamo noi, salvo che tu lo invii altrove.",
          ],
        },
        {
          p: "Non trattiamo categorie particolari di dati (art. 9 GDPR), dati giudiziari, né dati di pagamento: il servizio è gratuito e non ci sono transazioni.",
        },
      ],
    },
    {
      title: "3. Finalità e basi giuridiche",
      blocks: [
        {
          p: "Ogni trattamento ha una finalità e una base giuridica (art. 6 GDPR). Non usiamo i tuoi dati per pubblicità, remarketing o vendita a terzi.",
        },
        {
          ul: [
            "Erogazione del servizio (account, SDK, partite, classifica): art. 6, par. 1, lett. b) — esecuzione di un contratto o di misure precontrattuali da te richieste.",
            "Sicurezza, prevenzione abusi, debug, funzionamento del sito: art. 6, par. 1, lett. f) — legittimo interesse del Titolare a mantenere un servizio integro. Il legittimo interesse è bilanciato con i tuoi diritti: i log non sono usati per profilazione commerciale.",
            "Adempimenti di legge (es. risposta a richiesta dell’autorità): art. 6, par. 1, lett. c).",
            "Preferenza di lingua e guida di onboarding: art. 6, par. 1, lett. f) e, per i cookie tecnici, art. 122 Codice Privacy. Non è richiesto un banner di consenso perché non usiamo cookie di profilazione.",
          ],
        },
      ],
    },
    {
      title: "4. Natura del conferimento",
      blocks: [
        {
          p: "Senza un account GitHub non puoi ottenere una chiave API né registrare un agente. Puoi comunque usare lo Studio in locale (teleoperazione, demo) senza registrarti.",
        },
        {
          p: "Se inserisci un nome agente o un URL di repository, quei dati finiscono in classifica pubblica. Non inserire segreti, dataset privati o pesi che non puoi mostrare.",
        },
      ],
    },
    {
      title: "5. Destinatari e responsabili",
      blocks: [
        { p: "I dati possono essere comunicati, nei limiti delle finalità, a:" },
        {
          ul: [
            "GitHub, Inc., in qualità di titolare autonomo del tuo account GitHub e del flusso OAuth.",
            "Supabase (infrastruttura Postgres, Auth e, se abilitato, storage): tratta i dati per nostro conto come responsabile, sulla base del contratto di servizio e delle clausole sul trattamento.",
            "Vercel Inc. (hosting e rete di distribuzione del sito frontend).",
            "Eventuali fornitori dell’harness di valutazione, se il match live è eseguito su un server da noi indicato, solo per calcolare e inviare il risultato.",
            "Autorità pubbliche, se obbligati per legge.",
          ],
        },
        {
          p: "Chiunque visiti la classifica vede nome agente, URL repository, punteggi ed ELO. È il funzionamento del prodotto, non una cessione occultata.",
        },
      ],
    },
    {
      title: "6. Trasferimenti extra SEE",
      blocks: [
        {
          p: "GitHub e Vercel hanno sede negli Stati Uniti. Supabase può risiedere in UE o extra SEE a seconda della regione del progetto. Quando i dati escono dallo Spazio economico europeo, il trasferimento avviene in presenza di una garanzia dell’art. 46 GDPR (di norma Clausole contrattuali tipo della Commissione europea) e, ove applicabili, misure supplementari del fornitore.",
        },
        {
          p: "Ti invitiamo a collocare il progetto Supabase in una regione UE prima del lancio. Puoi chiederci dove sono fisicamente i dati al recapito indicato.",
        },
      ],
    },
    {
      title: "7. Tempi di conservazione",
      blocks: [
        {
          ul: [
            "Account e profilo: fino alla tua richiesta di cancellazione, o fino alla chiusura del servizio.",
            "Chiave API: fino alla rotazione o alla cancellazione dell’account.",
            "Record di classifica e partite pubbliche: per la durata del servizio, salvo oscuramento per abuso o tua richiesta legittima. L’ELO è un dato pubblico del benchmark: la cancellazione dell’account comporta, su richiesta, la rimozione o l’anonimizzazione delle righe a te riconducibili che controlliamo.",
            "Log tecnici e IP: di norma non oltre 12 mesi, salvo necessità di accertare illeciti.",
            "Cookie di lingua: 12 mesi, poi si rinnova se torni a scegliere la lingua.",
            "Cookie di sessione Auth: secondo la durata della sessione Supabase (revocabile con logout).",
          ],
        },
      ],
    },
    {
      title: "8. Diritti dell’interessato",
      blocks: [
        {
          p: "Puoi chiedere: accesso (art. 15), rettifica (art. 16), cancellazione (art. 17), limitazione (art. 18), portabilità (art. 20), opposizione (art. 21). Il diritto di revoca del consenso non si applica in modo rilevante, perché non fondiamo i trattamenti principali sul consenso.",
        },
        {
          p: "Per cancellare il profilo: scrivi a {email} o apri una issue su {github} dal tuo account. Cancelliamo i dati che controlliamo. GitHub resta titolare del tuo account GitHub. Le copie già pubblicate della classifica (cache, screenshot di terzi) possono sopravvivere fuori dal nostro controllo.",
        },
        {
          p: "Hai il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it) o all’autorità del tuo Paese UE. Puoi anche adire le vie giudiziarie.",
        },
      ],
    },
    {
      title: "9. Minori",
      blocks: [
        {
          p: "Il servizio non è rivolto a chi ha meno di 16 anni. GitHub impone i propri limiti di età. Se veniamo a conoscenza di un account di un minore sotto tale soglia, lo chiudiamo e cancelliamo i dati che controlliamo.",
        },
      ],
    },
    {
      title: "10. Cookie e memorizzazione locale",
      blocks: [
        {
          p: "Usiamo solo cookie e storage tecnici, necessari al servizio. Non installiamo cookie di profilazione, pixel pubblicitari, né strumenti di marketing di terzi. Per questo non mostriamo un banner di consenso (Linee guida cookie del Garante e art. 122 Codice Privacy).",
        },
        {
          ul: [
            "vsarena-locale: ricorda italiano o inglese. Durata 12 mesi. Prima parte. Necessario alla preferenza linguistica.",
            "Cookie di sessione Supabase Auth: ti riconoscono dopo il login GitHub. Prima parte / fornitore Auth. Necessari all’account.",
            "localStorage vsarena-theme-v1: tema chiaro o scuro, solo sul dispositivo.",
            "localStorage vsarena-sidebar-v1: menu laterale aperto o chiuso.",
            "localStorage vsarena-submit-guide: guida neofita o researcher. Resta sul tuo browser, non lo inviamo a un ad-network.",
          ],
        },
        {
          p: "Puoi cancellare cookie e dati locali dalle impostazioni del browser; in quel caso dovrai rifare login e scelta della lingua. Se in futuro aggiungessimo analitica non tecnica, aggiorneremo questa informativa e, se dovuto, chiederemo il consenso.",
        },
      ],
    },
    {
      title: "11. Processi automatizzati",
      blocks: [
        {
          p: "Il punteggio e l’aggiornamento ELO di una partita live sono calcolati in automatico dall’harness a partire dallo stato della simulazione. Non si tratta di una decisione automatizzata con effetti giuridici o analoghi ai sensi dell’art. 22 GDPR (non determina, ad esempio, l’accesso a un lavoro o a un credito). Puoi contestare un risultato palesemente errato o abusivo scrivendoci: verifichiamo e, se serve, nascondiamo la riga.",
        },
      ],
    },
    {
      title: "12. Sicurezza",
      blocks: [
        {
          p: "Adottiamo misure adeguate al rischio di VSArena V1: HTTPS, chiavi API ruotabili, il punteggio ufficiale non è scrivibile dal browser, ruoli distinti sul database. Nessun sistema è infallibile. Se una chiave API è esposta, ruotala subito dalla pagina Account.",
        },
      ],
    },
    {
      title: "13. Modifiche",
      blocks: [
        {
          p: "Possiamo aggiornare questa informativa se cambia il servizio o la legge. La data in testa vale come versione. Se le modifiche sono sostanziali, lo segnaleremo sul sito. L’uso continuato dopo la pubblicazione vale come presa visione, fermo restando i tuoi diritti GDPR.",
        },
      ],
    },
  ],
};

const en: LegalDocument = {
  kicker: "Privacy",
  title: "Privacy notice",
  updatedLine: "Last updated: {updatedEn}. VSArena V1.",
  intro: [
    "This notice is provided under Articles 13 and 14 of Regulation (EU) 2016/679 (GDPR) and Italian Legislative Decree 196/2003 as amended by Legislative Decree 101/2018, for anyone who uses the VSArena site and services.",
    "The service is VSArena V1: a free public stacking exam for embodied agents. It is not industrial robotics software and is not intended for children under 16.",
    "VSArena is not an incorporated company, is not listed in a companies register, and is not a legal entity. It is an open-source project of the independent lab {org}, run by a natural person. {org} is the lab name and the GitHub organization that hosts the repository: it is not a registered company. If a company is formed later, the controller and this notice will be updated.",
    "The controller is identified in public under the pseudonym {controller}. Contact: {email}. Repository: {github}.",
  ],
  sections: [
    {
      title: "1. Controller",
      blocks: [
        {
          p: "The controller is {controller}, a natural person identified by this pseudonym and founder of the independent lab {org}, running the VSArena open-source project from Italy. There is no company, LLC, Ltd or other legal entity acting as controller: processing is attributed to the individual who maintains the project. {org} is not a legal entity. No data protection officer has been appointed: Article 37 GDPR does not require one here (we are not a public body, we do not carry out large-scale regular systematic monitoring, and we do not process special-category data on a large scale).",
        },
        {
          p: "To exercise your rights or ask about processing: open an issue at {github} or write to {email}. We reply without undue delay and in any event within one month, extendable by two months in the cases allowed by Article 12 GDPR.",
        },
      ],
    },
    {
      title: "2. Categories of data",
      blocks: [
        { p: "We only process what we need to run the service:" },
        {
          ul: [
            "Account data: the GitHub identity GitHub shares with the OAuth app (typically username, id, email if public or granted, profile URL). We do not store a VSArena password.",
            "Our profile row: username, optional GitHub URL, API key (a credential — do not share it).",
            "Agents and leaderboard: agent name, repo URL if you add one, scores, ELO, match status and timestamps. These fields are public by design.",
            "Match data: poses, joint torques, outcome, telemetry used to score the task. This is for evaluation, not for ads.",
            "Technical data: IP address, user agent, access times, session cookies, error logs — to run the site and limit abuse.",
            "On-device preferences: UI language (vsarena-locale cookie), theme (vsarena-theme-v1), sidebar (vsarena-sidebar-v1), Submit guide (vsarena-submit-guide).",
            "Playground and Studio teleop: poses and telemetry stay in the tab. They do not write public ELO. Playground canned scripts are not a policy.",
            "Demos recorded in Studio: a file downloaded onto your computer. We do not upload it unless you send it elsewhere.",
          ],
        },
        {
          p: "We do not process special categories of data (Article 9 GDPR), criminal-record data, or payment data. The service is free.",
        },
      ],
    },
    {
      title: "3. Purposes and legal bases",
      blocks: [
        {
          p: "Each processing has a purpose and a legal basis (Article 6 GDPR). We do not use your data for ads, remarketing, or sale to third parties.",
        },
        {
          ul: [
            "Providing the service (account, SDK, matches, board): Article 6(1)(b) — contract or steps at your request.",
            "Security, abuse prevention, debugging, keeping the site up: Article 6(1)(f) — legitimate interest in an intact service, balanced against your rights. Logs are not used for commercial profiling.",
            "Legal duties (e.g. a lawful request from an authority): Article 6(1)(c).",
            "Language and onboarding preference: Article 6(1)(f) and, for technical cookies, Italian Privacy Code Article 122. No consent banner, because we do not use profiling cookies.",
          ],
        },
      ],
    },
    {
      title: "4. Whether you have to give us data",
      blocks: [
        {
          p: "Without a GitHub account you cannot get an API key or register an agent. You can still use Studio locally (teleop, demos) without signing in.",
        },
        {
          p: "If you set an agent name or repo URL, that goes on the public board. Do not put secrets, private datasets, or weights you cannot share.",
        },
      ],
    },
    {
      title: "5. Recipients",
      blocks: [
        { p: "Data may be disclosed, within the purposes above, to:" },
        {
          ul: [
            "GitHub, Inc., as independent controller of your GitHub account and the OAuth flow.",
            "Supabase (Postgres, Auth, and storage if enabled): processes data on our behalf as a processor under its terms and DPA.",
            "Vercel Inc. (hosting and CDN for the frontend).",
            "Any evaluation-harness host we run, only to compute and post a live result.",
            "Public authorities where required by law.",
          ],
        },
        {
          p: "Anyone who opens the leaderboard sees agent name, repo URL, scores and ELO. That is the product, not a hidden sale of data.",
        },
      ],
    },
    {
      title: "6. Transfers outside the EEA",
      blocks: [
        {
          p: "GitHub and Vercel are based in the United States. Supabase may sit in the EU or elsewhere depending on project region. Transfers outside the EEA rely on Article 46 GDPR safeguards (typically the European Commission’s Standard Contractual Clauses) and any extra measures the vendor publishes.",
        },
        {
          p: "Please put the Supabase project in an EU region before launch. You can ask us where data is stored using the contact details above.",
        },
      ],
    },
    {
      title: "7. Retention",
      blocks: [
        {
          ul: [
            "Account and profile: until you ask for deletion, or until the service shuts down.",
            "API key: until you rotate it or the account is deleted.",
            "Public matches and leaderboard rows: for the life of the service, unless we hide abuse or you make a valid erasure request. On account deletion we remove or anonymise rows we control that identify you.",
            "Technical logs and IPs: usually no more than 12 months, unless needed to investigate wrongdoing.",
            "Language cookie: 12 months, renewed if you pick a language again.",
            "Auth session cookies: as long as the Supabase session; you can end it with Sign out.",
          ],
        },
      ],
    },
    {
      title: "8. Your rights",
      blocks: [
        {
          p: "You may request access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), portability (Art. 20), and objection (Art. 21). Withdrawal of consent is not the main basis we use.",
        },
        {
          p: "To delete a profile: write to {email} or open an issue at {github} from your account. We delete what we control. GitHub remains controller of your GitHub account. Copies of the board already taken by others (caches, screenshots) may remain outside our control.",
        },
        {
          p: "You may lodge a complaint with the Italian Garante (www.garanteprivacy.it) or your EU supervisory authority, and you may go to court.",
        },
      ],
    },
    {
      title: "9. Children",
      blocks: [
        {
          p: "The service is not directed at anyone under 16. GitHub has its own age rules. If we learn an account belongs to a child below that age, we close it and delete data we control.",
        },
      ],
    },
    {
      title: "10. Cookies and local storage",
      blocks: [
        {
          p: "We only use technical cookies and storage needed for the service. No profiling cookies, ad pixels, or third-party marketing tools. We therefore do not show a consent banner (Italian Garante cookie guidance and Privacy Code Article 122).",
        },
        {
          ul: [
            "vsarena-locale: remembers Italian or English. 12 months. First-party. Needed for the language preference.",
            "Supabase Auth session cookies: recognise you after GitHub login. Needed for the account.",
            "localStorage vsarena-theme-v1: light or dark theme, on-device only.",
            "localStorage vsarena-sidebar-v1: side menu open or closed.",
            "localStorage vsarena-submit-guide: beginner vs researcher. Stays on your device; we do not send it to an ad network.",
          ],
        },
        {
          p: "You can clear cookies and site data in the browser; you will then sign in and pick a language again. If we later add non-technical analytics, we will update this notice and collect consent where required.",
        },
      ],
    },
    {
      title: "11. Automated processes",
      blocks: [
        {
          p: "Live match scores and ELO updates are computed automatically by the harness from simulation state. This is not an Article 22 decision with legal or similarly significant effects (it does not decide a job or credit, for example). If a result is clearly wrong or abusive, write to us: we will check and hide the row if needed.",
        },
      ],
    },
    {
      title: "12. Security",
      blocks: [
        {
          p: "Measures are sized for VSArena V1: HTTPS, rotatable API keys, official scores not writable from the browser, distinct database roles. No system is perfect. If an API key leaks, rotate it from Account immediately.",
        },
      ],
    },
    {
      title: "13. Changes",
      blocks: [
        {
          p: "We may update this notice if the service or the law changes. The date at the top is the version. Material changes will be flagged on the site. Continued use after publication means you have seen the new text; your GDPR rights remain.",
        },
      ],
    },
  ],
};

/**
 * Privacy notice for the active locale.
 */
export function privacyDocument(locale: Locale): LegalDocument {
  return locale === "it" ? it : en;
}
