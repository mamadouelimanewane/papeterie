/**
 * Plan comptable SYSCOHADA révisé (Acte uniforme OHADA relatif au droit comptable, 2017) :
 * comptes usuels d'une entreprise commerciale, complétables depuis Comptabilité › Plan comptable.
 * Les sous-comptes (ex. 4012 Livreurs, 5521 Versus) sont créés par l'application pour les écritures automatiques.
 */

export const JOURNALS = [
  { code: "VE", label: "Ventes" },
  { code: "AC", label: "Achats" },
  { code: "BQ", label: "Banque" },
  { code: "MM", label: "Monnaie électronique (Wave, Orange Money, Versus)" },
  { code: "CA", label: "Caisse" },
  { code: "OD", label: "Opérations diverses" },
  { code: "AN", label: "À-nouveaux" },
] as const
export type JournalCode = (typeof JOURNALS)[number]["code"]
export const JOURNAL_CODES = JOURNALS.map((j) => j.code) as string[]

/** Comptes utilisés par les écritures automatiques. */
export const ACC = {
  client: "4111",
  clientAdvance: "4191",
  supplier: "4011",
  drivers: "4012",
  partnerStore: "4017",
  vatSales: "4431",
  vatServices: "4432",
  vatDeductibleGoods: "4452",
  vatDeductibleServices: "4454",
  vatDue: "4441",
  vatCredit: "4449",
  salesGoods: "7011",
  salesDelivery: "7061",
  salesCommission: "7062",
  deliveryCost: "6122",
  bank: "5211",
  mobileMoney: "5521",
  cash: "5711",
  transfers: "5851",
  resultProfit: "1301",
  resultLoss: "1309",
  retainedProfit: "1211",
  retainedLoss: "1291",
  netProfit: "1311",
  netLoss: "1391",
  depreciationExpense: "6813",
} as const

export const CHART: [string, string][] = [
  // Classe 1 — Ressources durables
  ["101", "Capital social"], ["1011", "Capital souscrit, non appelé"], ["1013", "Capital souscrit, appelé, versé, non amorti"],
  ["104", "Compte de l'exploitant"], ["1041", "Apports temporaires"], ["1042", "Opérations courantes"], ["1043", "Rémunérations, impôts et autres charges personnelles"],
  ["111", "Réserve légale"], ["112", "Réserves statutaires ou contractuelles"], ["118", "Autres réserves"],
  ["121", "Report à nouveau créditeur"], ["1211", "Report à nouveau créditeur"], ["129", "Report à nouveau débiteur"], ["1291", "Report à nouveau débiteur"],
  ["130", "Résultat en instance d'affectation"], ["1301", "Résultat en instance d'affectation : bénéfice"], ["1309", "Résultat en instance d'affectation : perte"],
  ["131", "Résultat net : bénéfice"], ["1311", "Résultat net : bénéfice"], ["139", "Résultat net : perte"], ["1391", "Résultat net : perte"],
  ["141", "Subventions d'équipement"], ["151", "Amortissements dérogatoires"],
  ["161", "Emprunts obligataires"], ["162", "Emprunts et dettes auprès des établissements de crédit"], ["165", "Dépôts et cautionnements reçus"], ["166", "Intérêts courus"],
  ["168", "Autres emprunts et dettes"], ["191", "Provisions pour litiges"], ["198", "Autres provisions pour risques et charges"],
  // Classe 2 — Actif immobilisé
  ["211", "Frais de développement"], ["212", "Brevets, licences, concessions et droits similaires"], ["213", "Logiciels et sites internet"], ["2131", "Logiciels"], ["2132", "Sites internet"],
  ["215", "Fonds commercial"], ["216", "Droit au bail"],
  ["221", "Terrains"], ["231", "Bâtiments industriels, agricoles, administratifs et commerciaux sur sol propre"], ["234", "Aménagements, agencements et installations techniques"],
  ["241", "Matériel et outillage industriel et commercial"], ["244", "Matériel et mobilier"], ["2441", "Matériel de bureau"], ["2442", "Matériel informatique"], ["2444", "Mobilier de bureau"],
  ["245", "Matériel de transport"], ["2451", "Matériel automobile"], ["2452", "Matériel ferroviaire"], ["2456", "Matériel de transport à deux roues"],
  ["251", "Avances et acomptes versés sur immobilisations incorporelles"], ["252", "Avances et acomptes versés sur immobilisations corporelles"],
  ["275", "Dépôts et cautionnements versés"], ["276", "Intérêts courus"],
  ["281", "Amortissements des immobilisations incorporelles"], ["2813", "Amortissements des logiciels et sites internet"],
  ["283", "Amortissements des bâtiments"], ["284", "Amortissements du matériel"], ["2841", "Amortissements du matériel et outillage"],
  ["28441", "Amortissements du matériel de bureau"], ["28442", "Amortissements du matériel informatique"], ["28444", "Amortissements du mobilier de bureau"],
  ["2845", "Amortissements du matériel de transport"],
  ["291", "Dépréciations des immobilisations incorporelles"], ["294", "Dépréciations du matériel"],
  // Classe 3 — Stocks
  ["311", "Marchandises A"], ["3111", "Fournitures scolaires"], ["3112", "Livres"], ["321", "Matières premières"], ["335", "Emballages"],
  ["381", "Marchandises en cours de route"], ["391", "Dépréciations des stocks de marchandises"],
  // Classe 4 — Tiers
  ["401", "Fournisseurs, dettes en compte"], ["4011", "Fournisseurs"], ["4012", "Livreurs (prestataires)"], ["4017", "Boutique partenaire (part des ventes)"],
  ["408", "Fournisseurs, factures non parvenues"], ["409", "Fournisseurs débiteurs"], ["4091", "Fournisseurs, avances et acomptes versés"],
  ["411", "Clients"], ["4111", "Clients"], ["4118", "Clients, retenues de garantie"], ["416", "Créances clients litigieuses ou douteuses"],
  ["418", "Clients, produits à recevoir"], ["419", "Clients créditeurs"], ["4191", "Clients, avances et acomptes reçus"], ["4198", "Rabais, remises, ristournes à accorder"],
  ["421", "Personnel, avances et acomptes"], ["422", "Personnel, rémunérations dues"], ["428", "Personnel, charges à payer et produits à recevoir"],
  ["431", "Sécurité sociale"], ["4311", "Prestations familiales (CSS)"], ["4312", "Accidents du travail (CSS)"], ["432", "Caisses de retraite (IPRES)"], ["433", "Autres organismes sociaux"],
  ["441", "État, impôt sur les bénéfices"], ["442", "État, autres impôts et taxes"], ["443", "État, TVA facturée"],
  ["4431", "TVA facturée sur ventes"], ["4432", "TVA facturée sur prestations de services"], ["4434", "TVA sur factures à établir"],
  ["444", "État, TVA due ou crédit de TVA"], ["4441", "État, TVA due"], ["4449", "État, crédit de TVA à reporter"],
  ["445", "État, TVA récupérable"], ["4451", "TVA récupérable sur immobilisations"], ["4452", "TVA récupérable sur achats"], ["4454", "TVA récupérable sur services extérieurs et autres charges"],
  ["447", "État, impôts retenus à la source"], ["4471", "Impôt général sur le revenu (retenues sur salaires)"], ["448", "État, charges à payer et produits à recevoir"],
  ["449", "État, créances et dettes diverses"],
  ["462", "Associés, comptes courants"], ["4621", "Principal"], ["465", "Associés, dividendes à payer"],
  ["471", "Débiteurs et créditeurs divers"], ["4711", "Débiteurs divers"], ["4712", "Créditeurs divers"], ["472", "Créances et dettes sur titres de placement"],
  ["476", "Charges constatées d'avance"], ["477", "Produits constatés d'avance"], ["478", "Écarts de conversion actif"], ["479", "Écarts de conversion passif"],
  ["481", "Fournisseurs d'investissements"], ["491", "Dépréciations des comptes clients"], ["499", "Provisions pour risques à court terme"],
  // Classe 5 — Trésorerie
  ["501", "Titres du Trésor et bons de caisse à court terme"], ["521", "Banques locales"], ["5211", "Banque principale"], ["5212", "Banque secondaire"],
  ["531", "Chèques postaux"], ["55", "Instruments de monnaie électronique"], ["551", "Monnaie électronique carte carburant"],
  ["552", "Monnaie électronique téléphone portable"], ["5521", "Versus (Wave, Orange Money, carte) — paiements en ligne"], ["5522", "Wave"], ["5523", "Orange Money"],
  ["558", "Autres instruments de monnaie électronique"], ["561", "Crédits de trésorerie"], ["565", "Escompte de crédits ordinaires"],
  ["571", "Caisse siège social"], ["5711", "Caisse en monnaie nationale"], ["581", "Régies d'avance"], ["585", "Virements de fonds"], ["5851", "Virements de fonds"],
  ["591", "Dépréciations des titres de placement"],
  // Classe 6 — Charges des activités ordinaires
  ["601", "Achats de marchandises"], ["6011", "Achats de marchandises dans la Région"], ["6012", "Achats de marchandises hors Région"], ["6019", "Rabais, remises et ristournes obtenus (non ventilés)"],
  ["602", "Achats de matières premières et fournitures liées"], ["6031", "Variations des stocks de marchandises"],
  ["604", "Achats stockés de matières et fournitures consommables"], ["605", "Autres achats"], ["6051", "Fournitures non stockables — eau"], ["6052", "Fournitures non stockables — électricité"],
  ["6053", "Fournitures non stockables — autres énergies"], ["6054", "Fournitures d'entretien non stockables"], ["6055", "Fournitures de bureau non stockables"], ["6056", "Achats de petit matériel et outillage"],
  ["608", "Achats d'emballages"],
  ["61", "Transports"], ["612", "Transports sur ventes"], ["6122", "Transports sur ventes — livreurs"], ["613", "Transports pour le compte de tiers"], ["614", "Transports du personnel"], ["618", "Autres frais de transport"], ["6181", "Voyages et déplacements"],
  ["621", "Sous-traitance générale"], ["622", "Locations et charges locatives"], ["6222", "Locations de bâtiments"], ["6223", "Locations de matériels et outillages"],
  ["624", "Entretien, réparations et maintenance"], ["625", "Primes d'assurance"], ["626", "Études, recherches et documentation"], ["627", "Publicité, publications, relations publiques"],
  ["628", "Frais de télécommunications"], ["6281", "Frais de téléphone"], ["6283", "Frais d'internet"],
  ["631", "Frais bancaires"], ["6311", "Frais sur titres"], ["6318", "Autres frais bancaires (commissions de paiement en ligne)"],
  ["632", "Rémunérations d'intermédiaires et de conseils"], ["6324", "Honoraires des professions réglementées"], ["633", "Frais de formation du personnel"],
  ["634", "Redevances pour brevets, licences, logiciels"], ["6343", "Logiciels et abonnements"], ["637", "Rémunérations de personnel extérieur"], ["638", "Autres charges externes"],
  ["641", "Impôts et taxes directs"], ["6411", "Impôts fonciers et taxes annexes"], ["6412", "Patentes, licences et taxes annexes (CET)"], ["646", "Droits d'enregistrement"], ["647", "Pénalités et amendes fiscales"],
  ["651", "Pertes sur créances clients"], ["658", "Charges diverses"],
  ["661", "Rémunérations directes versées au personnel national"], ["663", "Indemnités forfaitaires versées au personnel"], ["664", "Charges sociales"], ["6641", "Charges sociales sur rémunération du personnel national"],
  ["671", "Intérêts des emprunts"], ["674", "Autres intérêts"], ["675", "Escomptes accordés"], ["676", "Pertes de change"],
  ["681", "Dotations aux amortissements d'exploitation"], ["6812", "Dotations aux amortissements des immobilisations incorporelles"], ["6813", "Dotations aux amortissements des immobilisations corporelles"],
  ["691", "Dotations aux provisions d'exploitation"], ["697", "Dotations aux provisions financières"],
  // Classe 7 — Produits des activités ordinaires
  ["701", "Ventes de marchandises"], ["7011", "Ventes de marchandises dans la Région"], ["7012", "Ventes de marchandises hors Région"], ["7019", "Rabais, remises et ristournes accordés"],
  ["705", "Travaux facturés"], ["706", "Services vendus"], ["7061", "Services vendus — livraison"], ["7062", "Services vendus — commissions de la plateforme"],
  ["707", "Produits accessoires"], ["71", "Subventions d'exploitation"], ["75", "Autres produits"], ["758", "Produits divers"],
  ["77", "Revenus financiers et produits assimilés"], ["773", "Escomptes obtenus"], ["776", "Gains de change"],
  ["781", "Transferts de charges d'exploitation"], ["791", "Reprises de provisions d'exploitation"], ["797", "Reprises de provisions financières"], ["798", "Reprises d'amortissements"],
  // Classe 8 — Autres charges et autres produits (hors activités ordinaires)
  ["81", "Valeurs comptables des cessions d'immobilisations"], ["812", "Immobilisations corporelles"], ["82", "Produits des cessions d'immobilisations"], ["822", "Immobilisations corporelles"],
  ["83", "Charges hors activités ordinaires"], ["84", "Produits hors activités ordinaires"], ["85", "Dotations hors activités ordinaires"], ["86", "Reprises hors activités ordinaires"],
  ["87", "Participation des travailleurs"], ["88", "Subventions d'équilibre"], ["89", "Impôts sur le résultat"], ["891", "Impôts sur les bénéfices de l'exercice"], ["895", "Impôt minimum forfaitaire (IMF)"],
]

/** Comptes nécessaires aux écritures automatiques (protégés contre la suppression). */
export const SYSTEM_ACCOUNTS = new Set<string>(Object.values(ACC))

/** Nature d'un compte : bilan (classes 1 à 5) ou gestion (6, 7, 8). */
export const accountClass = (code: string) => Number(code[0])
export const isBalanceSheet = (code: string) => accountClass(code) <= 5

/** Trésorerie et journal selon le moyen de paiement. */
export function treasuryFor(method?: string | null): { account: string; journal: "BQ" | "MM" | "CA" } {
  const m = (method ?? "").toLowerCase()
  if (/esp|cash|caisse/.test(m)) return { account: ACC.cash, journal: "CA" }
  if (/vir|banq|bank|ch[eè]que/.test(m)) return { account: ACC.bank, journal: "BQ" }
  return { account: ACC.mobileMoney, journal: "MM" } // Wave, Orange Money, Free Money, Versus
}
