# PayTrack

Tahsilatın net bir resmi. Ödeme planlarını ve taksitleri tek yerde takip et.

**Angular 22 + TypeScript · Java 17 · Spring Boot 3.5 · Spring Data JPA · Flyway · PostgreSQL 17**

![Masaüstü görünümü](docs/desktop.png)

[Telefon görünümü](docs/mobile.png)

## Özellikler

- Müşteri bilgileriyle aylık ödeme planları
- Tam sayı kuruş dağılımı ve ay sonunu koruyan vade hesabı
- Kısmi tahsilat, ödeme geçmişi ve kalan bakiye
- Satır kilidiyle eşzamanlı fazla tahsilat koruması
- İstek anahtarıyla idempotent ödeme; değişen içeriğe 409

## Çalıştırma

Gereksinimler: Node.js 22.22.3+, Java 17+ (JAVA_HOME tanımlı), Docker Compose.

```sh
git clone https://github.com/hassanbera/paytrack-spring.git
cd paytrack-spring
docker compose up -d --wait
```

API için bir terminal:

```sh
cd backend
./mvnw spring-boot:run
```

Windows PowerShell üzerinde `./mvnw` yerine `.\mvnw.cmd` kullan.

Arayüz için ikinci terminal (repo kökünden):

```sh
cd frontend
npm ci
npm start
```

- Arayüz: http://localhost:5203
- API: http://127.0.0.1:4203/api
- Veritabanı: localhost:55503
- Sağlık: http://127.0.0.1:4203/api/health

API ilk açılışta sürümlenmiş Flyway migrationlarını uygular. İkinci migration yalnızca ilk kurulumda kurgusal demo verilerini ekler; sonraki açılışlarda mevcut kayıtlar korunur. `docker compose down` servisi durdurur ve verileri volume içinde korur.

## Mimari

```text
frontend/src/             Angular standalone bileşeni, tipler ve HTTP istemcisi
backend/src/main/java/dev/bera/app/
  model/                 Veri modelleri
  repository/            JPA ve PostgreSQL erişimi
  service/               İş kuralları ve transactionlar
  controller/            HTTP giriş / çıkış
  common/                Doğrulama ve hata yanıtları
database/                 Okunabilir sürümlenmiş SQL
tests/api.test.mjs         Gerçek HTTP + PostgreSQL testleri
scripts/test.mjs           İzole test veritabanı ve API süreç yönetimi
```

Controller → Service → Repository → JPA → PostgreSQL. Controller veritabanına erişmez. İlişkiler SQL içinde foreign key ve indekslerle, JPA içinde model eşlemeleriyle korunur. İş kuralları service katmanındadır.

## API

Başarılı yanıtlar `{"data": ...}`; iş kuralı hataları `{"error": "..."}` biçimindedir. Geçersiz girdi 400, eksik kayıt 404, çakışma 409 döndürür. Framework seviyesindeki bozuk istekler standart HTTP hata yanıtı kullanabilir.

| Yöntem | Yol |
| --- | --- |
| GET | /api/health |
| GET | /api/plans |
| POST | /api/plans |
| GET | /api/plans/{id} |
| POST | /api/installments/{id}/payments |

Örnek istek ve kritik senaryolar [tests/api.test.mjs](tests/api.test.mjs) içinde çalıştırılabilir biçimde bulunur.

## Doğrulama

Repo kökünde:

```sh
npm test
```

Test scripti kendi rastgele isimli veritabanını oluşturur, backend'i derler, ayrı bir portta başlatır ve HTTP testlerini çalıştırır. Sonunda yalnızca kendi oluşturduğu test veritabanını kaldırır. Geliştirme kayıtlarına dokunmaz. Docker çalışıyor olmalıdır. Sunucu çıktısı `test-results/server.log` dosyasına yazılır.

Üretim derlemeleri:

```sh
cd backend
./mvnw -q package
```

```sh
cd frontend
npm run build
```

## Yapılandırma

`DB_URL` (varsayılan `jdbc:postgresql://localhost:55503/paytrack`), `DB_USER`, `DB_PASSWORD`, `PORT`, `HOST`. Yerel Compose hesabı `app`, parolası `local-development-only` değeridir; bunlar sadece yerel geliştirme içindir. Dağıtımda environment secret kullan.

Tutarlar TRY ve tam sayı kuruş cinsindedir. Banka, faiz, vergi, iade veya muhasebe entegrasyonu içermez. Tahsilat tutarı ve notu değişirse yeni idempotencyKey kullan; ağ hatasında aynı isteği aynı anahtarla tekrar gönder.

Bu sürüm tek çalışma alanlıdır; giriş ve kullanıcı bazında yetkilendirme içermez. API ve geliştirme arayüzü varsayılan olarak localhost üzerinde dinler. Üretim için kimlik doğrulama ve yetkilendirme ekle, Angular `frontend/dist/browser` çıktısını statik sun, aynı origin altındaki `/api` isteklerini backend'e yönlendir. Backend'in ağ dinleme adresini dağıtım ortamında açıkça yapılandır.

CI örneği [docs/ci.yml](docs/ci.yml) içinde bulunur. GitHub Actions workflow yazma yetkili bir oturumda `.github/workflows/ci.yml` yoluna taşıyarak etkinleştirilebilir.
