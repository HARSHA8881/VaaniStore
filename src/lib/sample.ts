import type { ShopProfile } from "./schema";

/** Realistic kirana store used by /preview, tests and the landing page demo. */
export const sampleShop: ShopProfile = {
  name: "Sharma General Store",
  slug: "sharma-general-store",
  tagline: "Ghar ka saara saamaan, ek hi jagah",
  category: "Kirana / General Store",
  about:
    "Serving Lajpat Nagar since 1998. Fresh atta, dal, masale and daily needs. Free home delivery within 2 km on orders above ₹300.",
  phone: "98765 43210",
  whatsapp: "98765 43210",
  upiId: "sharmastore@okicici",
  address: {
    line: "Shop 14, Central Market, Lajpat Nagar II",
    city: "New Delhi",
    pincode: "110024",
    mapsQuery: "Sharma General Store, Central Market, Lajpat Nagar II, New Delhi 110024",
  },
  hours: [
    { day: "mon", open: "09:00", close: "22:00", closed: false },
    { day: "tue", open: "09:00", close: "22:00", closed: false },
    { day: "wed", open: "09:00", close: "22:00", closed: false },
    { day: "thu", open: "09:00", close: "22:00", closed: false },
    { day: "fri", open: "09:00", close: "22:00", closed: false },
    { day: "sat", open: "09:00", close: "22:00", closed: false },
    { day: "sun", closed: true },
  ],
  products: [
    { id: "p1", name: "Aashirvaad Atta", priceInr: 280, unit: "5 kg", inStock: true },
    { id: "p2", name: "Toor Dal", priceInr: 140, unit: "kg", inStock: true },
    { id: "p3", name: "Tata Salt", priceInr: 28, unit: "kg", inStock: true },
    { id: "p4", name: "Fortune Sunflower Oil", priceInr: 165, unit: "litre", inStock: true },
    { id: "p5", name: "Parle-G", priceInr: 10, unit: "packet", inStock: true },
    { id: "p6", name: "Maggi Noodles", priceInr: 14, unit: "packet", inStock: false },
    { id: "p7", name: "Amul Butter", priceInr: 58, unit: "100 g", inStock: true },
    { id: "p8", name: "Basmati Rice", priceInr: 120, unit: "kg", inStock: true },
  ],
  theme: "light",
  language: "hinglish",
};
