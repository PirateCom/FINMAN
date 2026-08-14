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
  category: Category | null;
  profile: Pick<Profile, "display_name"> | null;
};

export type Settings = {
  id: number;
  currency: string;
};
