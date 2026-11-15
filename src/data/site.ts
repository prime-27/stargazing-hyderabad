// Everything you'd normally want to edit lives in this file.

export const contact = {
  phone: "+91 99632 81287",
  whatsapp: "919963281287", // digits only, with country code
  email: "contact@beyondthesky.in",
  instagram: "beyondthesky_india",
  mainSite: "https://beyondthesky.in/",
};

export const launchOffer = {
  text: "10% off School Astronomy Nights booked before 31 January 2027.",
  until: "2027-01-31", // hides itself after this date
};

export type PriceItem = { name: string; amount: string; unit: string; note: string };
export type PriceGroup = { label: string; featured?: boolean; cta: string; who: string; items: PriceItem[] };

export const prices: PriceGroup[] = [
  {
    label: "For schools", featured: true, cta: "Book for your school", who: "School",
    items: [
      { name: "School Astronomy Night", amount: "₹350", unit: "per student", note: "2–3 hours at your school. Minimum 60 students (₹21,000). Includes one classroom activity free and a participation certificate for every student." },
      { name: "Extra classroom activity", amount: "₹2,500", unit: "per activity", note: "Comet making, Moon phases, DIY solar system or eclipse demo, for up to 60 students." },
      { name: "Daytime solar observation", amount: "₹150", unit: "per student", note: "Safe Sun viewing with solar filters. ₹100 per student when added to a School Astronomy Night." },
    ],
  },
  {
    label: "Private & groups", cta: "Plan your night", who: "Apartment society / family",
    items: [
      { name: "Private night", amount: "₹6,999", unit: "per session", note: "Birthdays and family nights, for up to 25 people. ₹200 for each extra person." },
      { name: "Apartment society night", amount: "₹11,999", unit: "per session", note: "For up to 80 residents, with more telescopes so queues stay short." },
      { name: "College or company session", amount: "from ₹14,999", unit: "per session", note: "Telescope night with an astronomy talk, for up to 100 people." },
    ],
  },
  {
    label: "Experiences", cta: "Join a camp or workshop", who: "Meteor shower camp",
    items: [
      { name: "Meteor shower / dark-sky camp", amount: "₹1,999", unit: "per person", note: "A night under dark skies on meteor shower peaks and new moons. You travel to the site on your own." },
      { name: "Astrophotography workshop", amount: "₹1,499", unit: "per person", note: "3 hours. Bring your own camera or phone. Minimum 10 people." },
    ],
  },
];

// Used for Google's structured data (numbers only)
export const offersForGoogle = [
  { name: "School Astronomy Night", price: 350, description: "Per student, minimum 60 students" },
  { name: "Private stargazing night", price: 6999, description: "Per session, up to 25 people" },
  { name: "Apartment society stargazing night", price: 11999, description: "Per session, up to 80 people" },
  { name: "Meteor shower camp", price: 1999, description: "Per person" },
  { name: "Astrophotography workshop", price: 1499, description: "Per person" },
];

export const programmes = [
  { tag: "OBSERVATION", title: "Observation programmes", items: ["Telescope observation sessions", "Moon & planet nights", "Safe solar observation", "Meteor shower camps"] },
  { tag: "HANDS-ON", title: "Interactive activities", items: ["Comet making workshops", "Moon phases demonstration", "DIY solar system models"] },
  { tag: "LEARNING", title: "Educational sessions", items: ["Astronomy basics & theory", "Dedicated school outreach", "Eclipse demonstrations"] },
  { tag: "CAMERA", title: "Astrophotography workshops", items: ["DSLR night photography basics", "Milky Way & deep sky imaging", "Star trails capture", "Basic image processing"] },
];

// Meteor shower peak nights (YYYY-MM-DD). Add next year's when these pass.
export const showers = [
  { date: "2026-11-17", name: "Leonids", text: "Up to about 15 meteors an hour from a dark site. Best before dawn, towards the east." },
  { date: "2026-12-13", name: "Geminids", text: "The year's richest shower, active from mid-evening. A thin moon this year makes it ideal for a camp." },
  { date: "2027-01-03", name: "Quadrantids", text: "A short, sharp peak before dawn, with Orion and the Pleiades high in the evening sky." },
];

export const faqs = [
  { q: "Do you come to us?", a: "Yes. We bring the telescopes and equipment to your school, campus, apartment society, home or event venue in and around Hyderabad." },
  { q: "Do you run public ticketed events?", a: "No. Every session is booked by a school, group or family. If you'd like to join a session on your own, ask your school or society to book one, or message us about upcoming community drives." },
  { q: "What if it's cloudy?", a: "Sessions depend on the weather and the sky. We check the forecast with you before the night and plan another date if the sky won't cooperate." },
  { q: "What do we need to arrange?", a: "An open space with a clear view of the sky, like a ground, lawn or terrace, ideally away from bright floodlights. We'll talk through the details when you book." },
  { q: "Is it suitable for young children?", a: "Yes. We tailor the talk and activities to every age group, from primary school kids to adults." },
  { q: "Which language do you speak?", a: "English and Telugu." },
  { q: "Can we see the Sun safely?", a: "Yes. We run safe solar observation sessions during the day with proper solar filters. Never look at the Sun without one." },
];
