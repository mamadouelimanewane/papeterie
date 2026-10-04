import { Suspense } from "react"
import CheckoutResult from "../CheckoutResult"

export const metadata = { title: "Paiement — Schoolmatik Librairie" }

export default function CheckoutSuccessPage() {
  return <Suspense><CheckoutResult mode="success" /></Suspense>
}
