
export const cities = {
  Morocco: [
    "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", 
    "Oujda", "Kenitra", "Tétouan", "El Jadida", "Safi", "Mohammedia", "Khouribga",
    "Béni Mellal", "Nador", "Taza", "Settat"
  ],
  USA: [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Boston",
    "Seattle", "Miami", "San Francisco", "Atlanta"
  ],
  Europe: [
    "London", "Paris", "Berlin", "Madrid", "Rome", "Amsterdam", "Brussels",
    "Vienna", "Stockholm", "Copenhagen", "Oslo", "Dublin", "Prague", "Warsaw",
    "Lisbon", "Budapest"
  ],
  Canada: [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
    "Winnipeg", "Quebec City", "Hamilton", "Halifax", "Victoria"
  ],
  Africa: [
    "Cairo", "Lagos", "Kinshasa", "Johannesburg", "Dar es Salaam", "Alexandria",
    "Abidjan", "Nairobi", "Khartoum", "Accra", "Addis Ababa", "Cape Town",
    "Dakar", "Durban", "Pretoria"
  ]
};

export type Region = keyof typeof cities;
