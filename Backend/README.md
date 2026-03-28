# 🚀 Backend Başlatma Rehberi

Bu projenin mutfağını (backend) ayağa kaldırmak için şu basit adımları izleyin:

1. **Terminalinizi açın** ve `Backend` klasörünün içinde olduğunuzdan emin olun.
   ```bash
   cd Backend
   ```
2. **Paketleri yükleyin**: Aşağıdaki komutu yazıp Enter'a basın:
   ```bash
   npm install
   ```
3. **Sunucuyu başlatın**: Aşağıdaki komutu yazıp Enter'a basın:
   ```bash
   npm run dev
   ```

Tebrikler! Sunucunuz artık `http://localhost:5000` adresinde çalışıyor.

---

## 🐳 Docker ile Çalıştırma (Önerilen)

Eğer bilgisayarınızda Docker kuruluysa, hiçbir şey yüklemeden (npm install vs. yapmadan) projeyi ayağa kaldırabilirsiniz.

### 1. Docker Kurulu Değilse:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) indirip kurun.
*   **Windows Kullanıcıları İçin:** Kurulum sırasında "Use WSL 2 instead of Hyper-V" seçeneğinin işaretli olduğundan emin olun.
*   Kurulum bittikten sonra bilgisayarınızı yeniden başlatmanız gerekebilir.
*   Docker'ın çalıştığını kontrol etmek için terminale `docker --version` yazın.

### 2. Çalıştırma Adımları:
1.  Ana dizine (root) dönün: `cd ..`
2.  Konteynerları başlatın:
    ```bash
    docker compose up --build
    ```

Bu komut hem Backend'i hem de Frontend'i otomatik olarak ayağa kaldırır.
