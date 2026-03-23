#  VogueVault: AI-Powered Online Closet

**VogueVault**, fiziksel gardıroplar ile dijital kolaylık arasındaki boşluğu kapatmak için tasarlanmış, yapay zeka destekli bir dijital gardırop yönetim sistemidir.

---

##  1. Project Overview
VogueVault, kullanıcının fiziksel gardırobunun kişiselleştirilmiş bir "dijital ikizini" oluşturur. **Google Gemini Vision API**'nin gücünden yararlanan sistem (özel model eğitimine gerek duymadan zero-shot sınıflandırma kullanarak), yüklenen giyim eşyalarını otomatik olarak kategorize eder, belirli kıyafet kodlarına göre kombinler önerir ve kullanıcıların daha sürdürülebilir moda seçimleri yapmasına yardımcı olur.

### The Core Problems We Solve:
* **Decision Fatigue:** Kullanıcılar, özellikle moda normlarına aşina olmayanlar, "Smart Casual" gibi soyut kıyafet kodlarını kendi sahip oldukları eşyalarla somut kombinlere dönüştürmekte zorlanırlar.
* **Wardrobe Invisibility:** Fiziksel gardıroplar genellikle düzensizdir; aylar önce satın alınan ürünler kolayca unutulur ve kullanıcıların gerçekte neye sahip olduklarını hatırlamalarını zorlaştırır.
* **Inefficient Shopping:** Kullanıcılar, alışveriş yaparken mevcut gardıroplarını hatırlamadıkları için halihazırda sahip oldukları veya çok benzer ürünleri sıklıkla satın alırlar.

### Key Objectives:
* **Reduce Decision Fatigue:** Soyut kıyafet kodlarını kendi koleksiyonlarından somut kombinlere dönüştürmelerine yardımcı olmak.
* **Promote Sustainability:** Gereksiz yeni satın alımları caydırmak ve döngüsel ekonomi yaklaşımını teşvik etmek için mevcut kıyafetlerin kullanımını artırmak.
* **Smart Organization:** Manuel veri girişi olmadan ürünleri kategori, renk ve stile göre otomatik olarak etiketlemek ve sıralamak.
* **Visual Inspiration:** Kullanıcıların "ilham fotoğrafları" yüklemelerine ve kendi dijital dolapları içinde en yakın eşleşen ürünleri bulmalarına olanak tanımak.

---

##  2. Key Features
* **Digital Closet Management:** Kıyafet fotoğraflarını yükleyin ve AI kullanarak otomatik olarak kategorize edin. AI güven puanı eşiğin altına düşerse manuel kategori düzeltme özelliğini içerir.
* **Intelligent Concept Stylist:** AI görsel muhakemesini kullanarak belirli etkinliklere ve kıyafet kodlarına (örneğin, Smart Casual, Resmi) dayalı birden fazla kıyafet önerisi alın.
* **AI Visual Style Matcher:** Bir stil tanımlayıcı oluşturmak ve kendi gardırobunuzdan görsel olarak eşleşen ürünleri bulmak için bir ilham fotoğrafı yükleyin.
* **Smart Commerce Integration:** Bir kombindeki eksik parçaları tespit edin ve yetkisiz veri kazıma (scraping) yapmadan, doğrudan satın alma bağlantılarıyla gerçek ürün önerileri alın.
* **Secure User Authentication:** Supabase Auth kullanarak özel ve güvenli gardırop verisi yönetimi.

---

##  3. System Architecture & Software Engineering
Uygulamanın sağlam ve bakımı yapılabilir olmasını sağlamak için VogueVault modern yazılım mühendisliği ilkelerine sıkı sıkıya bağlıdır:

* **Layered (N-Tier) Architecture:** Sistem; Sunum, İş Mantığı, AI & Dış Servisler ve Veri & Altyapı katmanlarına ayrılmıştır. Bu; modülerlik yoluyla basitlik, çeviklik ve gelecekteki ölçeklendirme için hazırlık sağlar.
* **Factory Method Design Pattern:** Özellikle Dijital Dolap Yönetimi modülünde uygulanmıştır. Gemini Vision API bir görüntüyü sınıflandırdığında, bir `DigitalClosetFactory` dinamik olarak doğru nesneyi (örneğin, Gömlek, Pantolon, Ayakkabı) somutlaştırır. Bu, API rota işleyicisini somut kıyafet sınıflarından ayırarak karmaşık if/else zincirlerini ortadan kaldırır.

---

##  4. Technologies Used
| Category | Technology |
| :--- | :--- |
| **Frontend & API** | Next.js (React) and Tailwind CSS |
| **Database & Auth** | Supabase (PostgreSQL, Auth, and Storage) |
| **AI & Search** | Google Gemini Vision API & Google Custom Search API |
| **Deployment** | Docker and Railway.app |

---

##  5. Team Information
**Team Name:** ModaByte  
**Course:** COMP 3304 — Fundamentals of Software Engineering  
**Instructor:** Dr. Suphi Ucar

* **Doga Pirci**
* **Selin Sermet**
* **Asli Goktalay**
* **Arda Ceran**
