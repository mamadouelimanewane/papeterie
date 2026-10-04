import { Suspense } from "react"
import CheckoutResult from "../CheckoutResult"

export const metadata = { title: "Paiement — Schoolmatik Librairie" }

export default function CheckoutFailurePage() {
  return <Suspense><CheckoutResult mode="failure" /></Suspense>
}
