
export const cities = {
  Morocco: [
    "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", 
    "Oujda", "Kenitra", "Tétouan", "El Jadida", "Safi", "Mohammedia", "Khouribga",
    "Béni Mellal", "Nador", "Taza", "Settat", "Essaouira", "Laayoune", "Dakhla"
  ]
};

export type Region = keyof typeof cities;
