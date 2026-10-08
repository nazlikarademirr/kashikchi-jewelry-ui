import type { LocalizedText, Message, Notification, OrderItem, OrderStatus, UserRole } from '@/types';


export interface UserRecord {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
  failedAttempts: number;
  lockedUntil: string | null;
}

export interface CategoryRecord {
  id: string;
  slug: string;
  name: LocalizedText;
  parentId: string | null;
  sortOrder: number;
  imageKey?: string;
}

export interface ProductRecord {
  id: string;
  slug: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  stock: number;
  categoryId: string;
  subCategoryId: string | null;
  carat: number;
  price: number;
  discount: number;
  imageKeys: string[];
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface CartItemRecord {
  id: string;
  productId: string;
  quantity: number;
  customizationNote: string;
}

export interface CartRecord {
  userId: string;
  items: CartItemRecord[];
}

export interface OrderRecord {
  id: string;
  userId: string;
  status: OrderStatus;
  totalPrice: number;
  contactPhone: string;
  customerNote: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MockDb {
  users: UserRecord[];
  categories: CategoryRecord[];
  products: ProductRecord[];
  favorites: FavoriteRecord[];
  carts: CartRecord[];
  orders: OrderRecord[];
  notifications: Notification[];
  messages: Message[];
}

const lt = (tr: string, en: string): LocalizedText => ({ tr, en });
const daysAgo = (d: number, h = 0): string => new Date(Date.now() - d * 86_400_000 - h * 3_600_000).toISOString();

export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@kashikchi.com', password: 'Admin123!' },
  admin2: { email: 'yonetici@kashikchi.com', password: 'Admin123!' },
  admin3: { email: 'destek@kashikchi.com', password: 'Admin123!' },
  user: { email: 'musteri@example.com', password: 'Musteri123!' },
  user2: { email: 'ayse@example.com', password: 'Musteri123!' },
  user3: { email: 'mehmet@example.com', password: 'Musteri123!' },
};

const ids = {
  admin: '00000000-0000-4000-8000-000000000001',
  admin2: '00000000-0000-4000-8000-000000000011',
  admin3: '00000000-0000-4000-8000-000000000012',
  user: '00000000-0000-4000-8000-000000000002',
  user2: '00000000-0000-4000-8000-000000000021',
  user3: '00000000-0000-4000-8000-000000000022',
  catRing: '10000000-0000-4000-8000-000000000001',
  catNecklace: '10000000-0000-4000-8000-000000000002',
  catEarrings: '10000000-0000-4000-8000-000000000003',
  catBracelet: '10000000-0000-4000-8000-000000000004',
  catWeddingBands: '10000000-0000-4000-8000-000000000005',
  catMen: '10000000-0000-4000-8000-000000000006',
  catSets: '10000000-0000-4000-8000-000000000007',
  catCollections: '10000000-0000-4000-8000-000000000008',
  subSolitaireRing: '10000000-0000-4000-8000-000000010002',
  subEternity: '10000000-0000-4000-8000-000000010001',
  subFiveStone: '10000000-0000-4000-8000-000000010002',
  subSolitaireNecklace: '10000000-0000-4000-8000-000000020001',
  subRiviere: '10000000-0000-4000-8000-000000040003',
  subBridal: '10000000-0000-4000-8000-000000070001',
};

export const SEED_IDS = ids;

export function buildSeedCategories(): CategoryRecord[] {
  return [
    // Ana Kategoriler
    { id: ids.catRing, slug: 'yuzuk', name: lt('Yüzük', 'Rings'), parentId: null, sortOrder: 1, imageKey: '/images/ring-solitaire.jpg' },
    { id: ids.catNecklace, slug: 'kolye', name: lt('Kolye', 'Necklaces'), parentId: null, sortOrder: 2, imageKey: '/images/necklace-solitaire.jpg' },
    { id: ids.catEarrings, slug: 'kupe', name: lt('Küpe', 'Earrings'), parentId: null, sortOrder: 3, imageKey: '/images/hero_diamond.jpg' },
    { id: ids.catBracelet, slug: 'bileklik', name: lt('Bileklik', 'Bracelets'), parentId: null, sortOrder: 4, imageKey: '/images/bracelet-tennis.jpg' },
    { id: ids.catWeddingBands, slug: 'alyans', name: lt('Alyans', 'Wedding Bands'), parentId: null, sortOrder: 5, imageKey: '/images/ring-eternity.jpg' },
    { id: ids.catMen, slug: 'erkek', name: lt('Erkek', 'Men'), parentId: null, sortOrder: 6, imageKey: '/images/ring-five-stone.jpg' },
    { id: ids.catSets, slug: 'setler', name: lt('Setler', 'Sets'), parentId: null, sortOrder: 7, imageKey: '/images/set-bridal.jpg' },
    { id: ids.catCollections, slug: 'koleksiyonlar', name: lt('Koleksiyonlar', 'Collections'), parentId: null, sortOrder: 8, imageKey: '/images/atelier_craft.jpg' },

    // Yüzük
    { id: '10000000-0000-4000-8000-000000010001', slug: 'alyans', name: lt('Alyans', 'Wedding Bands'), parentId: ids.catRing, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000010002', slug: 'pirlanta-yuzuk', name: lt('Pırlanta Yüzük', 'Diamond Rings'), parentId: ids.catRing, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000010003', slug: 'altin-yuzuk', name: lt('Altın Yüzük', 'Gold Rings'), parentId: ids.catRing, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000010004', slug: 'safir-yuzuk', name: lt('Safir Yüzük', 'Sapphire Rings'), parentId: ids.catRing, sortOrder: 4 },
    { id: '10000000-0000-4000-8000-000000010005', slug: 'zumrut-yuzuk', name: lt('Zümrüt Yüzük', 'Emerald Rings'), parentId: ids.catRing, sortOrder: 5 },
    { id: '10000000-0000-4000-8000-000000010006', slug: 'yakut-yuzuk', name: lt('Yakut Yüzük', 'Ruby Rings'), parentId: ids.catRing, sortOrder: 6 },

    // Kolye
    { id: '10000000-0000-4000-8000-000000020001', slug: 'pirlanta-kolye', name: lt('Pırlanta Kolye', 'Diamond Necklaces'), parentId: ids.catNecklace, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000020002', slug: 'altin-kolye', name: lt('Altın Kolye', 'Gold Necklaces'), parentId: ids.catNecklace, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000020003', slug: 'safir-kolye', name: lt('Safir Kolye', 'Sapphire Necklaces'), parentId: ids.catNecklace, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000020004', slug: 'zumrut-kolye', name: lt('Zümrüt Kolye', 'Emerald Necklaces'), parentId: ids.catNecklace, sortOrder: 4 },
    { id: '10000000-0000-4000-8000-000000020005', slug: 'yakut-kolye', name: lt('Yakut Kolye', 'Ruby Necklaces'), parentId: ids.catNecklace, sortOrder: 5 },
    { id: '10000000-0000-4000-8000-000000020006', slug: 'harf-kolye', name: lt('Harf Kolye', 'Letter Necklaces'), parentId: ids.catNecklace, sortOrder: 6 },

    // Küpe
    { id: '10000000-0000-4000-8000-000000030001', slug: 'pirlanta-kupe', name: lt('Pırlanta Küpe', 'Diamond Earrings'), parentId: ids.catEarrings, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000030002', slug: 'halka-kupe', name: lt('Halka Küpe', 'Hoop Earrings'), parentId: ids.catEarrings, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000030003', slug: 'altin-kupe', name: lt('Altın Küpe', 'Gold Earrings'), parentId: ids.catEarrings, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000030004', slug: 'safir-kupe', name: lt('Safir Küpe', 'Sapphire Earrings'), parentId: ids.catEarrings, sortOrder: 4 },
    { id: '10000000-0000-4000-8000-000000030005', slug: 'zumrut-kupe', name: lt('Zümrüt Küpe', 'Emerald Earrings'), parentId: ids.catEarrings, sortOrder: 5 },
    { id: '10000000-0000-4000-8000-000000030006', slug: 'yakut-kupe', name: lt('Yakut Küpe', 'Ruby Earrings'), parentId: ids.catEarrings, sortOrder: 6 },

    // Bileklik
    { id: '10000000-0000-4000-8000-000000040001', slug: 'pirlanta-bileklik', name: lt('Pırlanta Bileklik', 'Diamond Bracelets'), parentId: ids.catBracelet, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000040002', slug: 'altin-bileklik', name: lt('Altın Bileklik', 'Gold Bracelets'), parentId: ids.catBracelet, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000040003', slug: 'su-yolu-bileklik', name: lt('Su Yolu Bileklik', 'Tennis Bracelets'), parentId: ids.catBracelet, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000040004', slug: 'kelepce-bileklik', name: lt('Kelepçe Bileklik', 'Bangle Bracelets'), parentId: ids.catBracelet, sortOrder: 4 },
    { id: '10000000-0000-4000-8000-000000040005', slug: 'zincir-bileklik', name: lt('Zincir Bileklik', 'Chain Bracelets'), parentId: ids.catBracelet, sortOrder: 5 },
    { id: '10000000-0000-4000-8000-000000040006', slug: 'safir-bileklik', name: lt('Safir Bileklik', 'Sapphire Bracelets'), parentId: ids.catBracelet, sortOrder: 6 },
    { id: '10000000-0000-4000-8000-000000040007', slug: 'zumrut-bileklik', name: lt('Zümrüt Bileklik', 'Emerald Bracelets'), parentId: ids.catBracelet, sortOrder: 7 },
    { id: '10000000-0000-4000-8000-000000040008', slug: 'yakut-bileklik', name: lt('Yakut Bileklik', 'Ruby Bracelets'), parentId: ids.catBracelet, sortOrder: 8 },

    // Alyans
    { id: '10000000-0000-4000-8000-000000050001', slug: 'kadin-alyans', name: lt('Kadın Alyans', 'Women\'s Wedding Bands'), parentId: ids.catWeddingBands, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000050002', slug: 'erkek-alyans', name: lt('Erkek Alyans', 'Men\'s Wedding Bands'), parentId: ids.catWeddingBands, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000050003', slug: 'cift-alyans', name: lt('Çift Alyans', 'Couple Bands'), parentId: ids.catWeddingBands, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000050004', slug: 'pirlanta-alyans', name: lt('Pırlanta Alyans', 'Diamond Wedding Bands'), parentId: ids.catWeddingBands, sortOrder: 4 },

    // Erkek
    { id: '10000000-0000-4000-8000-000000060001', slug: 'erkek-yuzuk', name: lt('Erkek Yüzük', 'Men\'s Rings'), parentId: ids.catMen, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000060002', slug: 'erkek-alyans-erkek', name: lt('Erkek Alyans', 'Men\'s Wedding Bands'), parentId: ids.catMen, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000060003', slug: 'erkek-kolye', name: lt('Erkek Kolye', 'Men\'s Necklaces'), parentId: ids.catMen, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000060004', slug: 'erkek-bileklik', name: lt('Erkek Bileklik', 'Men\'s Bracelets'), parentId: ids.catMen, sortOrder: 4 },
    { id: '10000000-0000-4000-8000-000000060005', slug: 'erkek-kupe', name: lt('Erkek Küpe', 'Men\'s Earrings'), parentId: ids.catMen, sortOrder: 5 },

    // Setler
    { id: '10000000-0000-4000-8000-000000070001', slug: 'takim-setleri', name: lt('Takım Setleri', 'Jewelry Sets'), parentId: ids.catSets, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000070002', slug: 'alyans-setleri', name: lt('Alyans Setleri', 'Wedding Sets'), parentId: ids.catSets, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000070003', slug: 'pirlanta-setler', name: lt('Pırlanta Setler', 'Diamond Sets'), parentId: ids.catSets, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000070004', slug: 'altin-setler', name: lt('Altın Setler', 'Gold Sets'), parentId: ids.catSets, sortOrder: 4 },

    // Koleksiyonlar
    { id: '10000000-0000-4000-8000-000000080001', slug: 'evlilik-teklifi', name: lt('Evlilik Teklifi', 'Proposal'), parentId: ids.catCollections, sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000080002', slug: 'nisan', name: lt('Nişan', 'Engagement'), parentId: ids.catCollections, sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000080003', slug: 'dugun', name: lt('Düğün', 'Wedding'), parentId: ids.catCollections, sortOrder: 3 },
    { id: '10000000-0000-4000-8000-000000080004', slug: 'anneler-gunu', name: lt('Anneler Günü', 'Mother\'s Day'), parentId: ids.catCollections, sortOrder: 4 },
    { id: '10000000-0000-4000-8000-000000080005', slug: 'sevgililer-gunu', name: lt('Sevgililer Günü', 'Valentine\'s Day'), parentId: ids.catCollections, sortOrder: 5 },
    { id: '10000000-0000-4000-8000-000000080006', slug: 'yil-donumu', name: lt('Yıl Dönümü', 'Anniversary'), parentId: ids.catCollections, sortOrder: 6 },
    { id: '10000000-0000-4000-8000-000000080007', slug: 'dogum-gunu', name: lt('Doğum Günü', 'Birthday'), parentId: ids.catCollections, sortOrder: 7 },
  ];
}

const IMG = {
  ringSolitaire: '/images/ring-solitaire.jpg',
  ringEternity: '/images/ring-eternity.jpg',
  ringFive: '/images/ring-five-stone.jpg',
  necklace: '/images/necklace-solitaire.jpg',
  bracelet: '/images/bracelet-tennis.jpg',
  set: '/images/set-bridal.jpg',
  detail: '/images/hero.jpg',
};

type P = Omit<ProductRecord, 'createdAt' | 'updatedAt'>;

export function buildSeedProducts(): ProductRecord[] {
  const items: P[] = [
    {
      id: '20000000-0000-4000-8000-000000000001', slug: 'aurora-tektas-yuzuk', code: 'KJ-YZK-001',
      name: lt('Aurora Tektaş Yüzük', 'Aurora Solitaire Ring'),
      description: lt(
        '1.00 karat yuvarlak brilliant kesim pırlanta, 18 ayar beyaz altın altı tırnak montürde. Zamansız bir klasik; GIA sertifikalı.',
        'A 1.00 carat round brilliant-cut diamond in an 18k white gold six-prong setting. A timeless classic, GIA certified.',
      ),
      stock: 2, categoryId: ids.catRing, subCategoryId: ids.subSolitaireRing, carat: 1, price: 148500, discount: 0,
      imageKeys: [IMG.ringSolitaire, IMG.detail], isActive: true, featured: true,
    },
    {
      id: '20000000-0000-4000-8000-000000000002', slug: 'lumiere-tamtur-yuzuk', code: 'KJ-YZK-002',
      name: lt('Lumière Tamtur Yüzük', 'Lumière Eternity Ring'),
      description: lt(
        'Tamamı pırlanta ile çevrelenmiş 18 ayar roze altın tamtur alyans. Toplam 1.50 karat.',
        'An 18k rose gold eternity band set all the way around with diamonds. 1.50 carats total weight.',
      ),
      stock: 4, categoryId: ids.catRing, subCategoryId: ids.subEternity, carat: 1.5, price: 96500, discount: 10,
      imageKeys: [IMG.ringEternity, IMG.detail], isActive: true, featured: true,
    },
    {
      id: '20000000-0000-4000-8000-000000000003', slug: 'etoile-bestas-yuzuk', code: 'KJ-YZK-003',
      name: lt('Étoile Beştaş Yüzük', 'Étoile Five-Stone Ring'),
      description: lt(
        'Derece derece büyüyen beş pırlantalı 18 ayar sarı altın yüzük. Müşterinin isteğine göre özel olarak üretilir.',
        'An 18k yellow gold ring with five graduated diamonds, handcrafted to order.',
      ),
      stock: 0, categoryId: ids.catRing, subCategoryId: ids.subFiveStone, carat: 1.25, price: 78000, discount: 0,
      imageKeys: [IMG.ringFive, IMG.detail], isActive: true, featured: true,
    },
    {
      id: '20000000-0000-4000-8000-000000000004', slug: 'seraphine-tektas-yuzuk', code: 'KJ-YZK-004',
      name: lt('Seraphine Tektaş Yüzük', 'Seraphine Solitaire Ring'),
      description: lt(
        '0.50 karat pırlanta, ince bant. Günlük kullanıma uygun zarif tektaş.',
        'A 0.50 carat diamond on a slim band. An elegant everyday solitaire.',
      ),
      stock: 6, categoryId: ids.catRing, subCategoryId: ids.subSolitaireRing, carat: 0.5, price: 42500, discount: 0,
      imageKeys: [IMG.ringSolitaire, IMG.detail], isActive: true, featured: false,
    },
    {
      id: '20000000-0000-4000-8000-000000000005', slug: 'celeste-tektas-kolye', code: 'KJ-KLY-001',
      name: lt('Celeste Tektaş Kolye', 'Celeste Solitaire Necklace'),
      description: lt(
        '0.75 karat pırlanta, ince 18 ayar beyaz altın zincir. Ayarlanabilir 40–45 cm.',
        'A 0.75 carat diamond on a fine 18k white gold chain. Adjustable 40–45 cm.',
      ),
      stock: 5, categoryId: ids.catNecklace, subCategoryId: ids.subSolitaireNecklace, carat: 0.75, price: 36900, discount: 0,
      imageKeys: [IMG.necklace, IMG.detail], isActive: true, featured: true,
    },
    {
      id: '20000000-0000-4000-8000-000000000006', slug: 'mira-tektas-kolye', code: 'KJ-KLY-002',
      name: lt('Mira Tektaş Kolye', 'Mira Solitaire Necklace'),
      description: lt(
        '0.30 karat pırlanta ile minimal tasarım. Hediye kutusunda gönderilir.',
        'A minimal design with a 0.30 carat diamond. Delivered in a gift box.',
      ),
      stock: 8, categoryId: ids.catNecklace, subCategoryId: ids.subSolitaireNecklace, carat: 0.3, price: 18900, discount: 15,
      imageKeys: [IMG.necklace, IMG.detail], isActive: true, featured: false,
    },
    {
      id: '20000000-0000-4000-8000-000000000007', slug: 'cascade-su-yolu-bileklik', code: 'KJ-BLK-001',
      name: lt('Cascade Su Yolu Bileklik', 'Cascade Tennis Bracelet'),
      description: lt(
        '3.00 karat toplam ağırlıkta, kesintisiz sıralı pırlantalarla 18 ayar beyaz altın su yolu bileklik.',
        'An 18k white gold tennis bracelet with an uninterrupted line of diamonds, 3.00 carats total.',
      ),
      stock: 1, categoryId: ids.catBracelet, subCategoryId: ids.subRiviere, carat: 3, price: 124000, discount: 0,
      imageKeys: [IMG.bracelet, IMG.detail], isActive: true, featured: true,
    },
    {
      id: '20000000-0000-4000-8000-000000000008', slug: 'dune-su-yolu-bileklik', code: 'KJ-BLK-002',
      name: lt('Dune Su Yolu Bileklik', 'Dune Tennis Bracelet'),
      description: lt(
        '1.50 karat toplam ağırlıkta ince su yolu bileklik. Sipariş üzerine hazırlanır.',
        'A slim tennis bracelet, 1.50 carats total, made to order.',
      ),
      stock: 0, categoryId: ids.catBracelet, subCategoryId: ids.subRiviere, carat: 1.5, price: 61500, discount: 0,
      imageKeys: [IMG.bracelet, IMG.detail], isActive: true, featured: false,
    },
    {
      id: '20000000-0000-4000-8000-000000000009', slug: 'reverie-gelin-seti', code: 'KJ-SET-001',
      name: lt('Reverie Gelin Seti', 'Reverie Bridal Set'),
      description: lt(
        'Kolye, küpe ve yüzükten oluşan 18 ayar roze altın pırlanta set. Toplam 2.20 karat.',
        'An 18k rose gold diamond set of necklace, earrings and ring. 2.20 carats total.',
      ),
      stock: 0, categoryId: ids.catSets, subCategoryId: ids.subBridal, carat: 2.2, price: 189000, discount: 5,
      imageKeys: [IMG.set, IMG.detail], isActive: true, featured: true,
    },
    {
      id: '20000000-0000-4000-8000-000000000010', slug: 'noor-tamtur-yuzuk', code: 'KJ-YZK-005',
      name: lt('Noor Tamtur Yüzük', 'Noor Eternity Ring'),
      description: lt(
        'İnce tamtur alyans, 0.80 karat. (Koleksiyondan geçici olarak kaldırıldı.)',
        'A slim eternity band, 0.80 carats. (Temporarily removed from the collection.)',
      ),
      stock: 3, categoryId: ids.catRing, subCategoryId: ids.subEternity, carat: 0.8, price: 54500, discount: 0,
      imageKeys: [IMG.ringEternity, IMG.detail], isActive: false, featured: false,
    },
  ];
  return items.map((p, i) => ({ ...p, createdAt: daysAgo(30 - i), updatedAt: daysAgo(30 - i) }));
}

export function buildSeedOrders(): Pick<MockDb, 'orders' | 'notifications' | 'messages'> {
  const orderId = '30000000-0000-4000-8000-000000000001';
  const p5 = buildSeedProducts()[4];
  const p3 = buildSeedProducts()[2];
  const items: OrderItem[] = [
    {
      id: '31000000-0000-4000-8000-000000000001', orderId, productId: p5.id, productName: p5.name, productCode: p5.code,
      productImage: p5.imageKeys[0], quantity: 1, unitPrice: p5.price, customizationNote: '',
    },
    {
      id: '31000000-0000-4000-8000-000000000002', orderId, productId: p3.id, productName: p3.name, productCode: p3.code,
      productImage: p3.imageKeys[0], quantity: 1, unitPrice: p3.price,
      customizationNote: 'Orta taş 1 karat, yan taşlar 0.5 karat, F renk, SI berraklık. Yüzük ölçüsü: 14.',
      customizationAttributes: { ringSize: '14' },
    },
  ];
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const orders = [
    {
      id: orderId, userId: ids.user, status: 'IN_PRODUCTION' as OrderStatus, totalPrice: total,
      contactPhone: '+90 532 000 00 00', customerNote: '', items, createdAt: daysAgo(5), updatedAt: daysAgo(2),
    },
    {
      id: '30000000-0000-4000-8000-000000000002', userId: ids.user2, status: 'DELIVERED' as OrderStatus, totalPrice: p5.price,
      contactPhone: '+90 555 111 22 33', customerNote: 'Hediye paketi olsun lütfen.', 
      items: [
        {
          id: '31000000-0000-4000-8000-000000000003', orderId: '30000000-0000-4000-8000-000000000002', productId: p5.id, productName: p5.name, productCode: p5.code,
          productImage: p5.imageKeys[0], quantity: 1, unitPrice: p5.price, customizationNote: '',
        }
      ], 
      createdAt: daysAgo(20), updatedAt: daysAgo(10),
    }
  ];
  const notifications: Notification[] = [
    { id: '40000000-0000-4000-8000-000000000001', userId: ids.admin, type: 'ORDER_CREATED', orderId, params: { customer: 'Elif Yılmaz' }, isRead: false, createdAt: daysAgo(5) },
    { id: '40000000-0000-4000-8000-000000000002', userId: ids.user, type: 'ORDER_STATUS_CHANGED', orderId, params: { status: 'IN_PRODUCTION' }, isRead: false, createdAt: daysAgo(2) },
    { id: '40000000-0000-4000-8000-000000000003', userId: ids.user, type: 'NEW_MESSAGE', orderId, params: { sender: 'Kashikchi' }, isRead: false, createdAt: daysAgo(1) },
  ];
  const messages: Message[] = [
    { id: '50000000-0000-4000-8000-000000000001', orderId, senderUserId: ids.user, senderName: 'Elif Yılmaz', senderRole: 0, message: 'Merhaba, yüzük için taş rengini F olarak teyit edebilir miyiz?', createdAt: daysAgo(3), isRead: true },
    { id: '50000000-0000-4000-8000-000000000002', orderId, senderUserId: ids.admin, senderName: 'Kashikchi', senderRole: 1, message: 'Merhaba Elif Hanım, F renk SI berraklıkta taş ayırdık. Üretime başladık, fotoğraf paylaşacağız.', createdAt: daysAgo(1), isRead: false },
  ];
  return { orders, notifications, messages };
}
