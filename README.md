# PixelPlanet

PixelPlanet, topluluk tarafından geliştirilen büyük ölçekli bir piksel tuvali
uygulamasıdır. Kullanıcılar tuval üzerine piksel yerleştirebilir, piksel sanatı
oluşturabilir ve farklı topluluklarla birlikte çalışabilir.

Bu proje, [TheRdMelon/pixelplanet](https://github.com/TheRdMelon/pixelplanet)
reposundaki PixelPlanet kaynak kodu temel alınarak hazırlanmıştır.

Lisans: GPL-3.0. Ayrıntılar için `LICENSE` dosyasına bakın.

## Bu sürümde yapılan değişiklikler

Bu repoda upstream kaynak koduna ek olarak aşağıdaki iyileştirmeler yapılmıştır:

- Node.js 20.9+ ve npm 10.2.3+ desteklenir.
- `sharp` güncel ve desteklenen sürüme yükseltilmiştir.
- Yerel parola hashleme için `bcryptjs` kullanılır.
- Varsayılan parola maliyeti 12'dir; eski hashler başarılı giriş sonrasında
  güvenli şekilde yükseltilir.
- `package-lock.json` güncellenmiştir.
- `package.json` ana giriş dosyası olarak `build/web.js` kullanır.
- `setup.sh` tek komutla bağımlılık kurulumu, derleme ve test yapar.
- GitHub Actions üzerinde Node.js 20 ve 22 ile build/test çalışır.
- Build ve test adımları zorunludur; başarısızlıklar gizlenmez.
- Proxy kontrolü HTTPS kullanır, IP adreslerini encode eder ve servis hatalarında
  güvenli şekilde fail-closed davranır.
- Redis yedeklemesi yalnızca ayrılmış veritabanını temizler (`FLUSHDB`).
- Canvas Redis'i ile backup Redis'inin aynı sunucu olup olmadığı `run_id` ile
  doğrulanır.
- Redis sunucu kimliği doğrulanamazsa yedekleme işlemi durdurulur.

## Tek komutla kurulum

Ubuntu veya Debian üzerinde Node.js 20.9+ kuruluysa, aşağıdaki komut depoyu
indirir, bağımlılıkları kurar, build alır ve doğrulama testini çalıştırır:

```bash
git clone https://github.com/GeceKusu-TR/Pixelplanet_fixed.git pixelplanet && cd pixelplanet && ./setup.sh
```

Depo zaten indirildiyse yalnızca şu komut yeterlidir:

```bash
./setup.sh
```

Kurulum betiği şunları yapar:

1. Node.js ve npm sürümlerini kontrol eder.
2. `npm ci` ile kilitlenmiş bağımlılıkları kurar.
3. Web ve backup bundle'larını oluşturur.
4. Build doğrulama testini çalıştırır.

`setup.sh`; Redis, MySQL/MariaDB, PM2 veya sistem paketlerini kurmaz.

## Gereksinimler

- Node.js 20.9 veya daha yeni sürüm
- npm 10.2.3 veya daha yeni sürüm
- Redis
- MySQL veya MariaDB
- Üretim çalıştırması için PM2
- Native bağımlılıklar için derleme araçları

PM2 kurulumu:

```bash
npm install -g pm2
```

## Kurulumdan sonra değiştirilmesi gerekenler

Kurulumdan sonra `ecosystem.yml` dosyasındaki sunucu ayarlarını kendi
ortamınıza göre değiştirin.

Zorunlu olarak kontrol edilmesi gereken alanlar:

- `HOSTURL`: Uygulamanın dışarıdan erişilen HTTPS adresi.
- `ASSET_SERVER`: Statik dosyaların sunulacağı adres.
- `PORT`: Node.js uygulamasının yerel portu.
- `REDIS_URL`: Uygulamanın kullandığı Redis adresi.
- `MYSQL_HOST`: MySQL/MariaDB sunucusu.
- `MYSQL_USER`: Veritabanı kullanıcı adı.
- `MYSQL_PW`: Veritabanı parolası.
- `MYSQL_DATABASE`: Kullanılacak veritabanı adı.
- `SESSION_SECRET`: Uzun ve rastgele oturum anahtarı.
- `APISOCKET_KEY`: Session secret'tan farklı, uzun ve rastgele API anahtarı.
- `ADMIN_IDS`: Yönetici olacak kullanıcı ID'leri; virgülle ayrılır.

Üretim parolalarını, Redis kimlik bilgilerini, session secret'larını, API
anahtarlarını veya OAuth secret'larını public repoya kesinlikle göndermeyin.
Bu değerleri sunucunun yerel PM2 yapılandırmasında veya ortam değişkenlerinde
tutun.

## Uygulamayı çalıştırma

Önce Redis ve MySQL/MariaDB servislerinin çalıştığından emin olun. Ardından:

```bash
pm2 start ecosystem.yml
pm2 save
```

Logları izlemek için:

```bash
pm2 logs web
```

Logları temizlemek için:

```bash
pm2 flush
```

Uygulamayı durdurmak için:

```bash
pm2 stop web
```

PM2'nin sunucu yeniden başladığında otomatik çalışması için:

```bash
pm2 startup
pm2 save
```

## Proxy kontrolü

Proxy kontrolünü açmak için `ecosystem.yml` içinde:

```yaml
USE_PROXYCHECK: 1
PROXYCHECK_CONTACT: 'iletisim@example.com'
```

Proxy sağlayıcısı cevap vermezse istek güvenli biçimde reddedilir; IP adresi
doğrulanamadığında temiz kabul edilmez. Proxy listesi:

```text
src/proxies.json
```

Proxy kontrolü kullanılmayacaksa `USE_PROXYCHECK` değerini `0` bırakın.

## Redis backup sistemi

Backup sistemi için ayrı bir Redis endpoint'i kullanın:

```bash
node build/backup.js \
  redis://localhost:6379 \
  redis://localhost:6380 \
  /mnt/pixelplanet-backups \
  15
```

Parametre sırası:

```text
CANVAS_REDIS_URL BACKUP_REDIS_URL BACKUP_DIRECTORY INTERVAL COMMAND
```

Backup sistemi:

- Canvas ve backup Redis'inin farklı olmasını zorunlu tutar.
- Redis `INFO server` çıktısındaki `run_id` değerlerini karşılaştırır.
- Kimlik doğrulanamazsa backup'ı çalıştırmaz.
- Günlük döndürmede yalnızca seçilen backup veritabanını `FLUSHDB` ile temizler.
- `FLUSHALL` kullanmaz.

Backup işlemi PM2 ile de çalıştırılabilir. Build sonrasında oluşturulan örnek
PM2 yapılandırmasını kullanabilirsiniz.

## Canvas ayarları

Canvas ayarları:

```text
src/canvases.json
```

Yeni bir canvas eklerken ilgili görsel dosyalarını da ekleyin:

```text
public/loading<CANVAS_ID>.png
public/assets3d/normal<CANVAS_ID>.jpg
public/preview<CANVAS_ID>.png
public/assets3d/specular<CANVAS_ID>.jpg
```

Canvas boyutları genellikle 4096, 16384 veya 65536 gibi dört kuvvetleri
olmalıdır.

## Cloudflare ve reverse proxy

Cloudflare IP aralıkları şu dosyada tutulur:

```text
src/utils/cloudflareip.js
```

Nginx veya başka bir reverse proxy kullanıyorsanız gerçek istemci IP'sinin
güvenilir biçimde iletildiğinden emin olun. `USE_XREALIP` açılacaksa proxy'nin
`X-Real-IP`, `X-Forwarded-Port` ve `X-Forwarded-Proto` başlıklarını doğru
ayarlaması gerekir.

Güvenilmeyen istemci başlıklarını doğrudan gerçek IP olarak kabul etmeyin.

## Geliştirme ve test

Build almak için:

```bash
npm run build
```

Build doğrulama testini çalıştırmak için:

```bash
npm test
```

Kaynak kod kontrolü için:

```bash
npm run lint:src
```

## Kaynak ve lisans

Temel proje:

https://github.com/TheRdMelon/pixelplanet

Bu repodaki ek build, CI, parola güvenliği, proxy kontrolü, Redis backup ve
kurulum değişiklikleri bu README'nin “Bu sürümde yapılan değişiklikler”
bölümünde açıklanmıştır.

Proje GPL-3.0 lisansı ile dağıtılır. Lisans metni için `LICENSE` dosyasına
bakın.

## Kullanım ve sorumluluk bildirimi

Bu repoda yer alan kaynak kodu, yapılandırma dosyaları, kurulum betikleri ve
belgeler kullanıcı tarafından incelenebilir, geliştirilebilir ve ihtiyaçlara
göre değiştirilebilir. Kullanıcılar yaptıkları değişikliklerin teknik,
operasyonel, hukuki ve güvenlik sonuçlarını kendileri değerlendirmekle
sorumludur.

Bu kaynak kodun kullanılması, değiştirilmesi, derlenmesi veya üretim ortamına
aktarılması sonucunda oluşabilecek veri kaybı, hizmet kesintisi, güvenlik
olayı, yanlış yapılandırma, üçüncü taraf hizmet sorunları veya diğer zararlardan
uygulamayı kullanan kişi ve kurum sorumludur. Üretim ortamına geçmeden önce
yedek alınması, gizli bilgilerin korunması, bağımlılıkların güncel tutulması ve
yerel mevzuata uygunluk kontrolü kullanıcı tarafından yapılmalıdır.

Bu repo, kullanıcı tarafından yapılan değişikliklerin her ortamda sorunsuz,
kesintisiz veya belirli bir amaca uygun çalışacağını garanti etmez. Değişiklik
yapmadan önce kaynak kodun ve verilerin yedeklenmesi önerilir.

Bu repoda istenilen her değişiklik yapılabilir. Bütün sorumluluk kullanıcıya
aittir.

**NE MUTLU TÜRKÜM DİYENE!**
