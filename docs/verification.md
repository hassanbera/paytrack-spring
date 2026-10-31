# Doğrulama

31 Ekim 2026 tarihinde yerel ortamda doğrulandı:

- Angular üretim derlemesi.
- Backend derlemesi ve gerçek PostgreSQL üzerinde HTTP testleri (`npm test`).
- İlk kurulum migrationları, demo verileri ve aynı veritabanıyla yeniden başlatma.
- 1440 px masaüstü ve 390 px telefon görünümü; sayfada yatay taşma olmaması.
- Sidebar ve ana içeriğin aynı belge başlangıcında hizalanması.

Test senaryoları [api.test.mjs](../tests/api.test.mjs) içinde gerçek HTTP istekleriyle tanımlıdır. Her test çalışması kendi veritabanı, portu ve derleme klasörünü kullanır. Ekran görüntüleri gerçek uygulamadan alınmıştır.

Otomatik GitHub Actions çalışması henüz etkin değildir; örnek tanım [ci.yml](ci.yml) içinde bulunur.
