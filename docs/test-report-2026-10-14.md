# Kashikchi Jewelry — Genel test raporu

Tarih: 14 Ekim 2026

## Sonuç

Frontend build başarılı. 28 frontend testi ve 96 backend testi geçti; toplam 124 testte başarısızlık yok. Bu sonuç bütün olası hataların bulunmuş olduğu anlamına gelmez.

## Bulunan ve düzeltilen işlev sorunları

- Yönetici ürün listesi tek istekle ürünleri alıyor ve sayfalama sunmuyordu. API sınırı nedeniyle ilk 50 üründen sonraki ürünlere bu ekrandan ulaşılamıyordu. Listeye 50 ürünlük sayfalama eklendi. Geçici veritabanında 150 ürünle üç sayfanın ayrı ürünler içerdiği ve yönetici ikinci sayfasının çalıştığı doğrulandı.
- Giriş hatası metni çevrilmiş olarak state içinde tutuluyordu; dil değişince hata eski dilde kalıyordu. Artık hata kodu saklanıyor, metin güncel dile göre üretiliyor. Türkçe–İngilizce geçişi tarayıcıda doğrulandı. Bilinmeyen giriş hatalarının da ekranda gösterilmesi sağlandı. Kilitlenme sayacı ve süre bitince uyarının kalkması korundu.
- Filtrelerin URL referansı render sırasında değiştiriliyordu. Senkronizasyon layout effect içine taşındı; hızlı girilen fiyat ve karat filtrelerinin birbirini silmediği tarayıcıda doğrulandı.

## İngilizce çeviriler

551 Türkçe ve 551 İngilizce anahtar karşılaştırıldı. Eksik/fazla anahtar yok. 38 çeviri güncellendi: Türkçe kalan şifre sıfırlama mesajı, başlık büyük harfleri, cümle sonu noktaları, ayar/karat ayrımı ve anlam farklılıkları giderildi. Gizlilik ve değişim metinleri Türkçe kaynakla eşitlendi; kaynakta bulunmayan ek iddialar kaldırıldı. Türkçe politika metinleri değiştirilmedi.

Üç yeni çeviri testi anahtarları, interpolasyon değişkenlerini, ilk harfleri, cümle sonu işaretlerini ve bazı önemli başlıkları denetliyor.

## Doğrulanan kapsam

- Backend otomatik testleri: giriş/kayıt, hesap kilitleme, access/refresh token ve çıkış, profil doğrulaması, rol yetkileri, Google OAuth doğrulama ve tek kullanımlık ticket, ürün CRUD ve özellikleri, görsel yükleme doğrulaması, kategori, filtre/sıralama/sayfalama, favoriler, sepet, sipariş oluşturma ve durum değişimi, bildirimler ve mesaj erişim yetkileri.
- Frontend otomatik testleri: oturum saklama, token yenileme, Google giriş proof akışı, aralık değerleri ve çeviri tutarlılığı.
- Yerel tarayıcı: fiyat ve karat filtrelerinin birlikte kullanımı, karat sıralama, temizleme butonu, ürün arama ve detaya geçiş, galeri ileri ve zoom işlemleri, giriş gerektiren özelleştirme yönlendirmesi, giriş hata mesajları ve dil değiştirme.
- 390 piksel telefon genişliğinde ürün listesi yatay taşmadı; mobil menü açılıp kapandı ve Ana Sayfa / Tüm Ürünler sırası doğrulandı.

## Kalan bulgular ve test sınırları

- ESLint hâlâ 33 hata ve 1 uyarı bildiriyor. Kalanlar ağırlıkla React effect/ref kullanımı, context dosyalarında fast refresh export kuralı ve boş catch blokları. Bu, çalışmayan 33 işlev anlamına gelmez; fakat kod kalite kontrolü henüz geçmiyor. İşleyişi değiştirebilecek geniş bir hook refaktörü bu test çalışmasına dahil edilmedi.
- Backend AutoMapper 13.0.1 için yüksek önem dereceli NU1903 güvenlik uyarısı veriyor. Resmî duyuru: https://github.com/advisories/GHSA-rvv3-g6hj-g44x . Düzeltilmiş sürümler 15.1.1 ve 16.1.1; mevcut 13.x sürümünden büyük sürüm geçişi gerektiriyor. Bu çalışmada paket ve eşleme davranışları değiştirilmedi. Projenin bu açığa fiilen açık olduğuna dair bir saldırı testi yapılmadı.
- Gerçek Google hesabıyla izin verme ve uçtan uca giriş, gerçek e-posta teslimatı ve canlı ortamda gerçek müşteri siparişi denenmedi. Bunlara ilişkin otomatik testler canlı sağlayıcı yerine kontrollü test ortamlarını kullanıyor.
- Üretim build'inin yerel preview ekranı ve dil geçişi açıldı. Bu build canlı API adresini kullanıyor; 127.0.0.1:4173 üzerinden ürün isteği sunucuya ulaşılamadı mesajıyla sonuçlandı. Bu nedenle preview üzerinde ürün akışı doğrulanmış sayılmadı; ürün tarayıcı kontrolleri çalışan localhost:5173 geliştirme ortamında yapıldı.
- Çeviri dosyası güncellenirken geliştirme ortamının hot reload konsolunda geçici bir I18nProvider hatası kaydedildi. Yeni açılan geliştirme sekmesinde ve üretim preview'ında aynı hata tekrarlanmadı.
- Backend testleri ayrı, geçici veritabanlarında çalıştı. Gerçek ürün/sipariş oluşturulmadı veya silinmedi.
- Değişiklikler yerelde; commit, push ve publish yapılmadı. Önceki 50 ürün/sayfa değişikliği korundu.
