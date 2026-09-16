export interface TelegramUser {
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  languageCode: string | null;
  premium: boolean;
  premiumSource: "stars" | "license" | null;
}

export interface PaymentStatus {
  payload: string;
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
}
