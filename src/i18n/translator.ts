/**
 * Traduction FR -> EN de l'interface affichée, appliquée au DOM.
 *
 * Les pages du back-office restent écrites en français. En anglais, chaque nœud texte
 * (et les attributs placeholder / title / aria-label) dont le contenu figure dans le
 * dictionnaire est remplacé ; un MutationObserver suit les rendus React. Le texte
 * original est conservé pour revenir au français sans recharger la page.
 * Les éléments marqués `data-no-i18n` (données saisies, noms propres…) ne sont jamais traduits.
 */
import { EN, PATTERNS } from "./en"

const ATTRS = ["placeholder", "title", "aria-label"] as const
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "NOSCRIPT"])

const norm = (s: string) => s.replace(/\s+/g, " ").trim()

/** Traduction d'une chaîne (exacte, puis motifs avec sous-parties traduites récursivement). */
export function translate(src: string): string | null {
  const key = norm(src)
  if (!key || !/[A-Za-zÀ-ÿ]/.test(key)) return null
  if (EN[key] !== undefined) return EN[key]
  // Ponctuation finale conservée : « Statut : », « Motif * », « Chargement… »
  const m = key.match(/^(.*?)(\s*[:*…]+)$/)
  if (m && EN[m[1]] !== undefined) return EN[m[1]] + m[2].replace(/^\s+:/, ":") // pas d'espace avant « : » en anglais
  for (const [re, fn] of PATTERNS) {
    const r = key.match(re)
    if (r) return fn((s: string) => translate(s) ?? s, ...r.slice(1))
  }
  return null
}

type Orig = { text: string; applied: string }

export function createTranslator(root: HTMLElement) {
  const texts = new Map<Text, Orig>()
  const attrs = new Map<Element, Record<string, Orig>>()
  let observer: MutationObserver | null = null

  const skipped = (el: Element | null): boolean => {
    for (let e = el; e; e = e.parentElement) {
      if (SKIP_TAGS.has(e.tagName) || e.hasAttribute("data-no-i18n") || (e as HTMLElement).isContentEditable) return true
    }
    return false
  }

  const doText = (node: Text) => {
    const cur = node.nodeValue ?? ""
    const known = texts.get(node)
    if (known && cur === known.applied) return // déjà traduit par nous
    if (skipped(node.parentElement)) return
    const tr = translate(cur)
    if (tr === null) { if (known) texts.delete(node); return }
    const lead = cur.match(/^\s*/)![0], trail = cur.match(/\s*$/)![0]
    const applied = lead + tr + trail
    texts.set(node, { text: cur, applied })
    node.nodeValue = applied
  }

  const doAttrs = (el: Element) => {
    if (skipped(el)) return
    for (const a of ATTRS) {
      const cur = el.getAttribute(a)
      if (!cur) continue
      const rec = attrs.get(el) ?? {}
      if (rec[a] && rec[a].applied === cur) continue
      const tr = translate(cur)
      if (tr === null) continue
      rec[a] = { text: cur, applied: tr }
      attrs.set(el, rec)
      el.setAttribute(a, tr)
    }
  }

  const walk = (start: Node) => {
    if (start.nodeType === Node.TEXT_NODE) { doText(start as Text); return }
    if (start.nodeType !== Node.ELEMENT_NODE) return
    doAttrs(start as Element)
    const w = document.createTreeWalker(start, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) doText(n as Text)
      else doAttrs(n as Element)
    }
  }

  return {
    start() {
      walk(root)
      observer = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === "characterData") doText(m.target as Text)
          else if (m.type === "attributes") doAttrs(m.target as Element)
          else m.addedNodes.forEach(walk)
        }
      })
      observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] })
    },
    /** Arrête et rétablit le français. */
    stop() {
      observer?.disconnect(); observer = null
      texts.forEach((o, node) => { if (node.isConnected && node.nodeValue === o.applied) node.nodeValue = o.text })
      attrs.forEach((rec, el) => { for (const [a, o] of Object.entries(rec)) if (el.getAttribute(a) === o.applied) el.setAttribute(a, o.text) })
      texts.clear(); attrs.clear()
    },
  }
}
