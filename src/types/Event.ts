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
  autoPromote: boolean;
  _count: {
    Registration: number;
  };
}
