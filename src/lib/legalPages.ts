import { prisma } from "@/lib/prisma"
import { getActiveStore } from "@/lib/store"

/**
 * Pages d'information publiques de la vitrine (/shop/infos/<slug>).
 * Le texte vient des « Pages de contenu » du back-office (même slug, statut Actif) ;
 * à défaut, un modèle est affiché, avec des [À COMPLÉTER] pour les informations légales du client.
 */
export const LEGAL_PAGES = [
  { slug: "cgv", title: "Conditions générales de vente", aliases: ["terms"] },
  { slug: "mentions-legales", title: "Mentions légales", aliases: [] },
  { slug: "confidentialite", title: "Politique de confidentialité", aliases: ["privacy"] },
] as const

type Store = { name: string; address: string | null; phone: string | null; email: string }

function template(slug: string, s: Store): string | null {
  const contact = `${s.name}${s.address ? `, ${s.address}` : ""}${s.phone ? ` — tél. ${s.phone}` : ""} — ${s.email}`
  switch (slug) {
    case "cgv": return `Objet
Les présentes conditions régissent les ventes de fournitures et de livres scolaires réalisées sur ce site par ${s.name}.

Commandes
Le client choisit ses articles ou un kit par classe, indique son adresse de livraison et valide sa commande. Un numéro de commande lui est communiqué.

Prix
Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises. Les frais de livraison sont affichés avant la validation de la commande. La remise d'un kit s'applique au prix total des articles du kit.

Paiement
Le paiement s'effectue en ligne (Wave, Orange Money, carte via notre prestataire de paiement) ou à la livraison lorsque cette option est proposée. Une commande payée en ligne n'est confirmée qu'après validation du paiement.

Livraison
Les commandes sont livrées à l'adresse indiquée, dans la zone desservie, par nos livreurs. Le client remet au livreur le code de livraison reçu lors de la commande.

Disponibilité et remboursement
Si un article payé n'est plus disponible, le client est contacté et remboursé du montant correspondant par le moyen de paiement utilisé (ou un autre moyen convenu).

Retours
[À COMPLÉTER : délai et conditions de retour ou d'échange des articles, articles exclus (livres annotés, articles ouverts…).]

Réclamations
Pour toute question : ${contact}.

Droit applicable
Les présentes conditions sont soumises au droit sénégalais.`
    case "mentions-legales": return `Éditeur du site
${s.name}
Adresse : ${s.address ?? "[À COMPLÉTER]"}
Téléphone : ${s.phone ?? "[À COMPLÉTER]"}
E-mail : ${s.email}
Forme juridique et capital : [À COMPLÉTER]
NINEA : [À COMPLÉTER]
RCCM : [À COMPLÉTER]
Directeur de la publication : [À COMPLÉTER]

Hébergement
Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com

Propriété intellectuelle
Les textes, logos et visuels du site appartiennent à ${s.name} ou à leurs auteurs et ne peuvent être reproduits sans autorisation.`
    case "confidentialite": return `Données collectées
Lors d'une commande, nous recueillons votre nom, votre numéro de téléphone, votre adresse et, si vous l'acceptez, la position de livraison. Si vous créez un compte, votre adresse e-mail peut aussi être enregistrée.

Utilisation
Ces données servent uniquement à traiter et livrer vos commandes, à vous contacter à leur sujet et à assurer le service après-vente. Elles ne sont ni vendues ni cédées.

Destinataires
Seuls notre équipe, le livreur chargé de votre commande (nom, téléphone, adresse) et notre prestataire de paiement (pour le règlement) y ont accès.

Conservation
[À COMPLÉTER : durée de conservation, par exemple 3 ans après la dernière commande.]

Vos droits
Conformément à la loi sénégalaise sur la protection des données personnelles (loi n° 2008-12), vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à : ${contact}.
[À COMPLÉTER : numéro de déclaration auprès de la Commission de Protection des Données Personnelles (CDP), le cas échéant.]`
  }
  return null
}

/** Titre et texte d'une page publique, ou null si elle n'existe pas. */
export async function getPublicPage(slug: string): Promise<{ title: string; content: string } | null> {
  const known = LEGAL_PAGES.find((p) => p.slug === slug)
  const slugs = known ? [known.slug, ...known.aliases] : [slug]
  const recs = await prisma.adminRecord.findMany({ where: { collection: "pages" }, orderBy: { updatedAt: "desc" } })
  for (const s of slugs) {
    const rec = recs.find((r) => {
      const d = r.data as { slug?: string; status?: string; content?: string }
      return d.slug === s && d.status === "Active" && !!d.content?.trim()
    })
    if (rec) {
      const d = rec.data as { title?: string; content: string }
      return { title: d.title || known?.title || slug, content: d.content }
    }
  }
  if (!known) return null
  const store = (await getActiveStore()) as Store | null
  const content = template(known.slug, store ?? { name: "Schoolmatik Librairie", address: null, phone: null, email: "contact@schoolmatik.sn" })
  return content ? { title: known.title, content } : null
}
