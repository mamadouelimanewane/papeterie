import { PrismaClient } from "@prisma/client";

// Définition des types pour l'API Versus
export interface VersusPaymentRequest {
  name: string;
  merchant_name?: string;
  first_name: string;
  last_name: string;
  external_reference: string;
  order_reference: string;
  phone_number?: string;
  email?: string;
  success_url?: string;
  failure_url?: string;
  amount: number;
  currency: string;
  service_id?: number;
  payment_account_number?: string;
  metadata?: Record<string, any>;
}

export interface VersusPaymentResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const VERSUS_BASE_URL = process.env.VERSUS_BASE_URL || "https://business-staging.versusfintech.com";
const VERSUS_LOGIN = process.env.VERSUS_LOGIN || "";
const VERSUS_PASSWORD = process.env.VERSUS_PASSWORD || "";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Authentifie et récupère un token d'accès Versus
 */
export async function getVersusToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt - 300000) {
    return cachedToken;
  }

  try {
    const res = await fetch(`${VERSUS_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: VERSUS_LOGIN,
        password: VERSUS_PASSWORD,
      }),
    });

    const result = await res.json();

    if (res.ok && result.data?.access_token) {
      cachedToken = result.data.access_token;
      tokenExpiresAt = Date.now() + 3600 * 1000;
      return cachedToken;
    } else {
      console.error("Erreur auth Versus:", result);
      return null;
    }
  } catch (error) {
    console.error("Exception auth Versus:", error);
    return null;
  }
}

/**
 * Récupère la liste des services disponibles
 */
export async function getVersusServices() {
  const token = await getVersusToken();
  if (!token) throw new Error("Impossible d'obtenir le token Versus");

  const res = await fetch(`${VERSUS_BASE_URL}/api/services`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  return await res.json();
}

/**
 * Initialise un paiement sur l'API Versus
 */
export async function createVersusPayment(payload: VersusPaymentRequest): Promise<VersusPaymentResponse> {
  const token = await getVersusToken();
  if (!token) throw new Error("Impossible d'obtenir le token Versus");

  const res = await fetch(`${VERSUS_BASE_URL}/api/payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  
  if (!res.ok) {
    console.error("Erreur lors de l'initialisation du paiement:", result);
    return { success: false, message: result.message || "Erreur de paiement", data: result };
  }

  return { success: true, data: result };
}

/**
 * Vérifie le statut d'un paiement
 */
export async function getVersusPayment(paymentRef: string) {
  const res = await fetch(`${VERSUS_BASE_URL}/api/payment/${paymentRef}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return await res.json();
}
