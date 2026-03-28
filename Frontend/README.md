# 🎨 Frontend Başlatma Rehberi

Uygulamanın görsel yüzünü (frontend) açmak için şu adımları izleyin:

> **Önemli:** Başlamadan önce Backend'in (Siyah terminal) çalıştığından emin olun!

1. **Yeni bir terminal açın** ve `Frontend` klasörünün içinde olduğunuzdan emin olun.
   ```bash
   cd Frontend
   ```
2. **Paketleri yükleyin**: Aşağıdaki komutu yazarak gerekli dosyaları indirin:
   ```bash
   npm install
   ```
3. **Uygulamayı başlatın**: Aşağıdaki komutu yazarak uygulamayı çalıştırın:
   ```bash
   npm run dev
   ```

Her şey hazır! Tarayıcınızda otomatik açılmazsa `http://localhost:3000` adresine gidebilirsiniz.

*(Eğer 'Network Error' hatası alıyorsanız, Backend terminalinin açık ve çalışıyor olduğundan emin olun.)*

---

## 🐳 Docker ile Çalıştırma (Önerilen)

Eğer ayrı terminallerle (Frontend ve Backend) uğraşmak istemiyorsanız Docker en kolay yoldur.

### 1. Docker Kurulu Değilse:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) indirip kurun.
*   **Önemli (Windows):** Kurulum sırasında "Use WSL 2 instead of Hyper-V" seçeneğinin işaretli olduğundan emin olun.
*   Kurulumdan sonra bir kez bilgisayarınızı yeniden başlatmanız gerekebilir.
*   Terminalinize `docker --version` yazarak kontrol edin.

### 2. Çalıştırma Adımları:
1.  Ana dizine (root) dönün: `cd ..`
2.  Tüm projeyi tek komutla başlatın:
    ```bash
    docker compose up --build
    ```

Artık Frontend `http://localhost:3000` adresinde her şey hazır bir şekilde çalışıyor olacak.
