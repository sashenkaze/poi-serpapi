export type Loc = {
  lat: number;
  lng: number;
  label: string;
};

export type GeoResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export type Place = {
  place_id?: string;
  title: string;
  address?: string;
  type?: string;
  rating?: number;
  reviews?: number;
  price?: string;
  phone?: string;
  thumbnail?: string;
  open_state?: string;
  gps_coordinates?: { latitude: number; longitude: number };
};