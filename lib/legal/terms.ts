import type { Locale } from "@/lib/i18n/locale";
import type { LegalDocument } from "@/lib/legal/types";

const it: LegalDocument = {
  kicker: "Termini",
  title: "Termini e condizioni di utilizzo",
  updatedLine: "Ultimo aggiornamento: {updatedIt}. VSArena V1.",
  intro: [
    "Questi termini regolano l’uso del sito VSArena, dello Studio, dell’SDK, dell’harness e della classifica (insieme, il «Servizio»). Usando il Servizio dichiari di averli letti e di accettarli.",
    "Il prestatore è {controller}, persona fisica identificata con questo pseudonimo (il «Prestatore»), founder del laboratorio indipendente {org}. VSArena non è una società costituita: è un progetto open source V1 pubblicato sotto l’organizzazione GitHub {org}. Non c’è partita IVA di società, né iscrizione al registro delle imprese riferita a VSArena o a {org}. Contatti: {email} — repository {github}.",
    "Il Servizio è gratuito. Comprende il sito, il Playground pubblico, Studio, l’SDK, l’harness quando è configurato, e la classifica. Non è un sistema di controllo di robot reali e non offre SLA. Se il progetto diventerà una società, questi termini saranno aggiornati.",
  ],
  sections: [
    {
      title: "1. Definizioni",
      blocks: [
        {
          ul: [
            "Utente: chi visita il sito o usa Studio, SDK o account.",
            "Account: profilo creato con login GitHub.",
            "Agente: programma o policy che invii o registri per una prova.",
            "Studio: simulazione nel browser (un agente, stacking).",
            "Playground: cella pubblica nello stesso tab; demo e script canned, senza ELO.",
            "Arena: prova 1 contro 1, non ancora disponibile.",
            "Classifica: tabella pubblica di nomi, URL, punteggi ed ELO.",
            "Harness: processo che esegue un match live e può scrivere l’ELO ufficiale.",
          ],
        },
      ],
    },
    {
      title: "2. Oggetto e gratuità",
      blocks: [
        {
          p: "Il Prestatore mette a disposizione, a titolo gratuito, un ambiente di prova per agenti embodied su un compito di stacking, con protocollo documentato e, quando l’harness è configurato, una classifica pubblica. Chi offre il Servizio è una persona fisica, founder del laboratorio indipendente {org}: non una società costituita.",
        },
        {
          p: "Non è inclusa la conduzione di un robot fisico, l’hosting della tua GPU, la pubblicazione su PyPI, né l’Arena 1 contro 1 finché non è dichiarata disponibile sul sito. Funzioni segnate «in arrivo» non fanno parte del contratto attuale.",
        },
      ],
    },
    {
      title: "3. Capacità e account",
      blocks: [
        {
          p: "Per registrarti devi avere almeno 16 anni e un account GitHub in regola con i termini di GitHub. Il contratto con GitHub è autonomo: il Prestatore non è parte di quel rapporto.",
        },
        {
          p: "La chiave API è una credenziale. Va tenuta segreta, non va committata, va ruotata se esposta. Chiunque la usi agisce come te. Sei responsabile delle azioni compiute con la tua chiave e con il tuo account.",
        },
      ],
    },
    {
      title: "4. Licenza d’uso del Servizio",
      blocks: [
        {
          p: "Ti concediamo una licenza personale, non esclusiva, non trasferibile, revocabile, di usare il Servizio per ricerca, studio, sviluppo e valutazione dei tuoi agenti, nel rispetto di questi termini e della legge.",
        },
        {
          p: "Il codice del repository, se pubblicato, si usa secondo la licenza ivi indicata. Questi termini non ti trasferiscono marchi, logo o il nome VSArena.",
        },
      ],
    },
    {
      title: "5. Contenuti dell’Utente e classifica",
      blocks: [
        {
          p: "Restano tuoi i diritti sul codice dell’agente, sui pesi e sul repository. Inviando un match live o registrando un agente, concedi al Prestatore una licenza gratuita, mondiale, non esclusiva, per la durata della tutela, di riprodurre e mostrare al pubblico nome agente, URL del repo, punteggi, ELO e metadati di partita, allo scopo di operare la classifica e documentare il benchmark.",
        },
        {
          p: "La classifica è pubblica. Non inserire segreti, dati personali di terzi, materiale illecito o pesi che non puoi mostrare. Il browser non è autorizzato a scrivere l’ELO: solo l’ingest dell’harness, con il segreto di configurazione, è la via ufficiale.",
        },
        {
          p: "Possiamo nascondere o rimuovere voci placeholder, abusive, fuorvianti o contrarie a questi termini, senza che ciò comporti un obbligo di monitoraggio generale delle informazioni (D.lgs. 70/2003 e normativa sui servizi digitali, in quanto applicabile).",
        },
      ],
    },
    {
      title: "6. Uso consentito e vietato",
      blocks: [
        { p: "È consentito usare il Servizio per valutare agenti, registrare demo, sviluppare policy e citare i risultati pubblici con correttezza." },
        { p: "È vietato, in particolare:" },
        {
          ul: [
            "tentare di falsificare punteggi, eludere l’harness, saturare o attaccare l’infrastruttura;",
            "inviare malware, tentare accessi non autorizzati, o usare il Servizio per reati;",
            "caricare contenuti illeciti, diffamatori, o che violino diritti di terzi;",
            "spacciare demo dello Studio o script del Playground per ELO ufficiale;",
            "presentare ColorSeek o Baseline-IK come reti VLA se non lo sono;",
            "rivendere l’accesso al Servizio senza accordo scritto.",
          ],
        },
      ],
    },
    {
      title: "7. Proprietà intellettuale",
      blocks: [
        {
          p: "Sito, marchio di fatto VSArena, layout e testi del Prestatore sono di {controller}, salvo opere di terzi e componenti open source con le rispettive licenze. Puoi citare VSArena in un paper o in un post indicando il link al sito e senza suggerire una sponsorizzazione se non esiste.",
        },
      ],
    },
    {
      title: "8. Disponibilità e modifiche",
      blocks: [
        {
          p: "Il Servizio è offerto «nello stato in cui si trova». Possiamo interromperlo, cambiarlo, resettare ambienti di prova o migrare l’infrastruttura. Non garantiamo uptime, determinismo bit-a-bit rispetto a Isaac Sim o ad altri simulatori, né che un punteggio resti immutato dopo un aggiornamento della fisica o del protocollo. Di cambiamenti sostanziali al protocollo pubblico daremo notizia in documentazione.",
        },
      ],
    },
    {
      title: "9. Esclusione di garanzia",
      blocks: [
        {
          p: "Nella misura massima consentita dalla legge, il Prestatore non offre garanzie di commerciabilità, idoneità a uno scopo particolare, assenza di errori o idoneità a controllare hardware reale. I risultati della simulazione non sostituiscono prove su robot, valutazioni di sicurezza o certificazioni.",
        },
      ],
    },
    {
      title: "10. Responsabilità",
      blocks: [
        {
          p: "Il Servizio è gratuito. Salvo i casi in cui la legge lo vieta, il Prestatore non risponde dei danni indiretti, del lucro cessante, della perdita di dati o di opportunità di pubblicazione, né dei danni da uso del Servizio per controllare macchine reali.",
        },
        {
          p: "Nulla in questi termini esclude o limita la responsabilità per dolo o colpa grave, per danni da morte o lesioni della persona, o altre responsabilità che il diritto italiano non consente di pattuire in deroga (art. 1229 c.c. e norme inderogabili a tutela del consumatore).",
        },
        {
          p: "Se, nonostante la gratuità, una norma imponesse un risarcimento, esso non supererà, in totale, 100 (cento) euro per utente, salvo ancora i casi inderogabili di cui sopra.",
        },
      ],
    },
    {
      title: "11. Manleva",
      blocks: [
        {
          p: "Se i tuoi contenuti o il tuo uso del Servizio causano reclami di terzi, tieni indenne il Prestatore dalle spese e dai danni che ne derivino, salvo i casi in cui il fatto sia dovuto a dolo o colpa grave del Prestatore.",
        },
      ],
    },
    {
      title: "12. Sospensione e recesso",
      blocks: [
        {
          p: "Puoi smettere di usare il Servizio in qualsiasi momento e chiedere la cancellazione dell’account come indicato nell’informativa privacy. Il Prestatore può sospendere o chiudere un account in caso di violazione, rischio per la sicurezza, o cessazione del progetto, con preavviso ragionevole salvo urgenza.",
        },
        {
          p: "Non ci sono abbonamenti né pagamenti: non si applica un rinnovo tacito. Se in futuro si introducessero servizi a pagamento, saranno regolati da condizioni separate, con diritto di recesso per i consumatori ove previsto dal Codice del Consumo.",
        },
      ],
    },
    {
      title: "13. Consumatori",
      blocks: [
        {
          p: "Se sei un consumatore residente nell’UE (art. 3, D.lgs. 206/2005), restano ferme le tutele inderogabili del Codice del Consumo, incluso il foro del consumatore (art. 66-bis). Le clausole che, in danno del consumatore, fossero vessatorie si considerano nulle, ferma la validità del resto del contratto ove possibile.",
        },
        {
          p: "Il Servizio è digitale e inizia con il tuo uso (apertura dello Studio o login). Trattandosi di prestazione gratuita, non c’è un prezzo da rimborsare. Resta il diritto di chiedere la cancellazione dei dati.",
        },
      ],
    },
    {
      title: "14. Legge applicabile e foro",
      blocks: [
        {
          p: "Si applica la legge italiana, salvo norme di diritto internazionale privato che impongano altra legge inderogabile.",
        },
        {
          p: "Per le controversie con utenti che non sono consumatori, è competente il foro del luogo di residenza o domicilio del Prestatore in Italia. Per i consumatori vale il foro previsto dalla legge.",
        },
        {
          p: "È possibile, se entrambe le parti lo vogliono, tentare una composizione stragiudiziale. I consumatori UE possono usare la piattaforma ODR della Commissione europea.",
        },
      ],
    },
    {
      title: "15. Comunicazioni",
      blocks: [
        {
          p: "Le comunicazioni si intendono valide se inviate a {email} o, in mancanza, tramite issue sul repository {github}. Le modifiche a questi termini si pubblicano su questa pagina con nuova data. L’uso successivo alla pubblicazione costituisce accettazione, salvo i diritti inderogabili.",
        },
      ],
    },
    {
      title: "16. Clausole finali",
      blocks: [
        {
          p: "Se una clausola è nulla o inefficace, le altre restano in vigore. Il mancato esercizio di un diritto non è rinuncia. Questi termini, con l’informativa privacy, sono l’accordo intero sul Servizio e sostituiscono intese precedenti sullo stesso oggetto. In caso di contrasto tra versione italiana e inglese, per gli utenti in Italia prevale l’italiano.",
        },
      ],
    },
  ],
};

const en: LegalDocument = {
  kicker: "Terms",
  title: "Terms of use",
  updatedLine: "Last updated: {updatedEn}. VSArena V1.",
  intro: [
    "These terms govern use of the VSArena site, Studio, SDK, harness and leaderboard (the “Service”). By using the Service you confirm you have read and accept them.",
    "The provider is {controller}, a natural person identified by this pseudonym (the “Provider”) and founder of the independent lab {org}. VSArena is not an incorporated company: it is a V1 open-source project published under the {org} GitHub organization. There is no company VAT number and no companies-register filing for VSArena or {org}. Contact: {email} — repository {github}.",
    "The Service is free. It includes the site, the public Playground, Studio, the SDK, the harness when configured, and the leaderboard. It is not a real-robot controller and it has no SLA. If the project later becomes a company, these terms will be updated.",
  ],
  sections: [
    {
      title: "1. Definitions",
      blocks: [
        {
          ul: [
            "User: anyone who visits the site or uses Studio, the SDK or an account.",
            "Account: the profile created with GitHub login.",
            "Agent: a program or policy you submit or register for a task.",
            "Studio: the in-browser simulation (one agent, stacking).",
            "Playground: the public in-tab cell; demos and canned scripts, no ELO.",
            "Arena: 1v1, not available yet.",
            "Leaderboard: the public table of names, URLs, scores and ELO.",
            "Harness: the process that runs a live match and may write official ELO.",
          ],
        },
      ],
    },
    {
      title: "2. What we provide, for free",
      blocks: [
        {
          p: "The Provider offers, free of charge, a stacking work-cell for embodied agents, a documented protocol and, when the harness is configured, a public leaderboard. The Service is offered by a natural person, founder of the independent lab {org} — not by an incorporated company.",
        },
        {
          p: "We do not provide control of a physical robot, hosted GPU inference, a PyPI release, or 1v1 Arena until the site says it is live. “Coming soon” features are not part of this contract.",
        },
      ],
    },
    {
      title: "3. Eligibility and accounts",
      blocks: [
        {
          p: "You must be at least 16 and have a GitHub account that complies with GitHub’s terms. Your contract with GitHub is separate.",
        },
        {
          p: "The API key is a credential. Keep it secret, do not commit it, rotate it if it leaks. Anyone who uses it acts as you. You are responsible for actions taken with your key and account.",
        },
      ],
    },
    {
      title: "4. Licence to use the Service",
      blocks: [
        {
          p: "We grant you a personal, non-exclusive, non-transferable, revocable licence to use the Service for research, learning, development and evaluation of your agents, subject to these terms and the law.",
        },
        {
          p: "Repository code, if published, is used under the licence in that repository. These terms do not transfer trademarks, logos or the VSArena name.",
        },
      ],
    },
    {
      title: "5. Your content and the board",
      blocks: [
        {
          p: "You keep rights in your agent code, weights and repo. By running a live match or registering an agent you grant the Provider a free, worldwide, non-exclusive licence, for the term of protection, to reproduce and display the agent name, repo URL, scores, ELO and match metadata in order to run the board and document the benchmark.",
        },
        {
          p: "The board is public. Do not submit secrets, third-party personal data, unlawful material or weights you cannot show. The browser cannot write ELO; only harness ingest with the configured secret is official.",
        },
        {
          p: "We may hide or remove placeholder, abusive, misleading or non-compliant entries. That is not a general obligation to monitor all information.",
        },
      ],
    },
    {
      title: "6. Acceptable use",
      blocks: [
        { p: "You may use the Service to evaluate agents, record demos, develop policies and cite public results fairly." },
        { p: "You may not, in particular:" },
        {
          ul: [
            "fake scores, bypass the harness, or attack the infrastructure;",
            "submit malware, attempt unauthorised access, or use the Service to commit crimes;",
            "upload unlawful, defamatory or infringing content;",
            "present Studio demos or Playground scripts as official ELO;",
            "present ColorSeek or Baseline-IK as neural VLAs if they are not;",
            "resell access without written agreement.",
          ],
        },
      ],
    },
    {
      title: "7. Intellectual property",
      blocks: [
        {
          p: "The site, the VSArena name as used here, layout and Provider copy belong to {controller}, except third-party works and open-source components under their licences. You may cite VSArena in a paper or post with a link to the site, without implying sponsorship that does not exist.",
        },
      ],
    },
    {
      title: "8. Availability and changes",
      blocks: [
        {
          p: "The Service is provided as-is. We may interrupt it, change it, reset test environments or move infrastructure. We do not guarantee uptime, bit-identical physics versus Isaac Sim or other stacks, or that a score stays frozen after a physics or protocol change. Material protocol changes will be noted in the docs.",
        },
      ],
    },
    {
      title: "9. No warranty",
      blocks: [
        {
          p: "To the fullest extent allowed by law, the Provider gives no warranty of merchantability, fitness for a particular purpose, error-free operation, or fitness to control real hardware. Simulation results do not replace real-robot tests, safety reviews or certifications.",
        },
      ],
    },
    {
      title: "10. Liability",
      blocks: [
        {
          p: "The Service is free. Except where the law forbids it, the Provider is not liable for indirect loss, lost profits, lost data, lost publication opportunity, or damage from using the Service to control real machines.",
        },
        {
          p: "Nothing in these terms excludes or limits liability for wilful misconduct or gross negligence, death or personal injury, or other liability that Italian law does not allow to be waived (Civil Code Article 1229 and mandatory consumer rules).",
        },
        {
          p: "If, despite the Service being free, a rule still imposes damages, the total will not exceed EUR 100 per user, again except for the mandatory cases above.",
        },
      ],
    },
    {
      title: "11. Indemnity",
      blocks: [
        {
          p: "If your content or your use of the Service causes third-party claims, you will indemnify the Provider for resulting costs and damages, except where the Provider’s wilful misconduct or gross negligence caused the claim.",
        },
      ],
    },
    {
      title: "12. Suspension and ending use",
      blocks: [
        {
          p: "You may stop using the Service at any time and request account deletion as described in the privacy notice. The Provider may suspend or close an account for breach, security risk, or project shutdown, with reasonable notice unless urgent.",
        },
        {
          p: "There are no subscriptions or charges, so no tacit renewal. If paid features are added later, they will have separate terms and, for consumers, withdrawal rights where the Consumer Code requires them.",
        },
      ],
    },
    {
      title: "13. Consumers",
      blocks: [
        {
          p: "If you are an EU consumer (Italian Consumer Code, Legislative Decree 206/2005), mandatory protections remain, including the consumer’s court (Article 66-bis). Unfair terms that harm the consumer are void; the rest of the contract may survive.",
        },
        {
          p: "The Service is digital and starts when you use it (opening Studio or signing in). It is free, so there is no price to refund. You may still ask for erasure of your data.",
        },
      ],
    },
    {
      title: "14. Governing law and courts",
      blocks: [
        {
          p: "Italian law applies, except where private international law makes another mandatory law prevail.",
        },
        {
          p: "Disputes with non-consumers go to the courts of the Provider’s residence or domicile in Italy. Consumers use the court the law gives them.",
        },
        {
          p: "If both sides agree, you may try an out-of-court settlement. EU consumers may use the European Commission’s ODR platform.",
        },
      ],
    },
    {
      title: "15. Notices",
      blocks: [
        {
          p: "Notices are valid if sent to {email} or, if that is unset, via an issue on {github}. Changes to these terms are posted on this page with a new date. Use after publication is acceptance, without prejudice to mandatory rights.",
        },
      ],
    },
    {
      title: "16. Miscellaneous",
      blocks: [
        {
          p: "If one clause is void, the others remain. Failure to enforce a right is not a waiver. These terms plus the privacy notice are the whole agreement on the Service. For users in Italy, the Italian text prevails if it conflicts with the English.",
        },
      ],
    },
  ],
};

/**
 * Terms of use for the active locale.
 */
export function termsDocument(locale: Locale): LegalDocument {
  return locale === "it" ? it : en;
}
