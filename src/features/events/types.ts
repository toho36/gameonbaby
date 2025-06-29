export interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  capacity: number;
  from: string;
  to: string;
  visible: boolean;
  bankAccountId?: string | null;
  _count: {
    Registration: number;
  };
}

export interface Participant {
  first_name: string;
  last_name: string | null;
  created_at: Date;
  user_id?: string;
  email?: string;
}
