export type TxType = "income" | "expense";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string;
};

export type Category = {
  id: string;
  name: string;
  type: TxType;
  color: string;
};

export type Transaction = {
  id: string;
  type: TxType;
  amount_bani: number;
  category_id: string | null;
  date: string;
  note: string | null;
  entered_by: string;
  created_at: string;
  recurring_payment_id: string | null;
  category: Category | null;
  profile: Pick<Profile, "display_name"> | null;
};

export type Settings = {
  id: number;
  currency: string;
  base_currency: string;
};

export type RepeatMonths = 0 | 1 | 6 | 12;

export type Reminder = {
  id: string;
  title: string;
  amount_bani: number;
  category_id: string | null;
  due_date: string;
  repeat_months: RepeatMonths;
  note: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
};

export type RecurringInterval = 1 | 3 | 6 | 12;

export type RecurringPayment = {
  id: string;
  title: string;
  type: TxType;
  amount_bani: number;
  category_id: string | null;
  note: string | null;
  interval_months: RecurringInterval;
  next_date: string;
  end_date: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  category: Category | null;
};
