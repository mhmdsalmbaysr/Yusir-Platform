# منصة يُسر — دليل المشروع

**يُسر** هي منصة تفاعلية تعرض المتاجر والمنتجات على خريطة اليمن. تعمل بالكامل على المتصفح (Static SPA) ولا تحتاج إلى خادم خلفي.

---

## هيكلة الملفات

```
map3/
├── index.html              ← type="module" → src/main.js
├── admin.html              ← type="module" → src/admin-main.js
├── login.html              ← type="module" → src/login-main.js
├── merchant.html           ← type="module" → src/merchant-main.js
├── super-admin.html        ← type="module" → src/super-admin-main.js
│
├── src/
│   ├── main.js                 # مدخل التطبيق الرئيسي
│   ├── admin-main.js           # مدخل لوحة الإدارة
│   ├── login-main.js           # مدخل تسجيل الدخول
│   ├── merchant-main.js        # مدخل لوحة التاجر
│   ├── super-admin-main.js     # مدخل لوحة السوبر أدمن
│   │
│   ├── core/
│   │   ├── config/app.js       # إعدادات مركزية (خريطة، تخزين، endpoints)
│   │   ├── constants/app.js    # ثوابت (أسماء الأحداث، عتبات التكبير)
│   │   ├── helpers/
│   │   │   ├── dom.js          # دوال DOM مساعدة ($, qs, createElement)
│   │   │   └── format.js       # تنسيق الأرقام والأسعار
│   │   ├── services/
│   │   │   ├── EventBus.js     # Observer Pattern — ناقل الأحداث
│   │   │   └── StorageService.js  # واجهة موحّدة لـ localStorage/sessionStorage
│   │   └── utils/
│   │       └── debounce.js     # Debounce للبحث
│   │
│   ├── modules/
│   │   ├── map/
│   │   │   ├── MapManager.js    # Singleton — إدارة الخريطة
│   │   │   ├── LayerManager.js  # طبقات الخريطة
│   │   │   ├── MarkerFactory.js # Factory — إنشاء الماركرات
│   │   │   ├── PopupFactory.js  # Factory — إنشاء النوافذ المنبثقة
│   │   │   ├── GeoJsonService.js# تحميل/تصدير GeoJSON
│   │   │   └── MapEvents.js     # أحداث الخريطة (حركة، تكبير)
│   │   │
│   │   ├── governorates/
│   │   │   └── GovernorateService.js  # حدود المحافظات (zoom ≥ 7)
│   │   │
│   │   ├── districts/
│   │   │   └── DistrictService.js     # حدود المديريات (zoom ≥ 9)
│   │   │
│   │   ├── fielddata/
│   │   │   └── FieldDataService.js    # الأحياء والحارات (zoom ≥ 11)
│   │   │
│   │   ├── stores/
│   │   │   ├── StoreRepository.js     # Repository — جلب/تخزين المتاجر
│   │   │   ├── StoreService.js        # Business Logic
│   │   │   ├── StoreController.js     # عرض الماركرات والتفاعل
│   │   │   ├── StoreSidebar.js        # الشريط الجانبي للمتجر
│   │   │   └── StoreCard.js           # بطاقة المتجر
│   │   │
│   │   ├── products/
│   │   │   └── ProductModal.js        # نافذة عرض المنتج مع إضافة للسلة
│   │   │
│   │   ├── cart/
│   │   │   ├── CartManager.js         # Observer — إدارة حالة السلة
│   │   │   ├── CartStorage.js         # Repository — حفظ السلة
│   │   │   └── CartUI.js              # تحديث واجهة السلة
│   │   │
│   │   ├── checkout/
│   │   │   └── CheckoutManager.js     # إتمام الطلب عبر واتساب
│   │   │
│   │   ├── reviews/
│   │   │   ├── ReviewService.js       # منطق التقييمات
│   │   │   └── ReviewUI.js            # واجهة النجوم التفاعلية
│   │   │
│   │   ├── search/
│   │   │   └── SearchController.js    # بحث Nominatim (عربي، يمن)
│   │   │
│   │   └── users/
│   │       └── AuthService.js         # مصادقة موحّدة (جلسات + localStorage)
│   │
│   └── shared/
│       └── ui/
│           └── Toast.js               # إشعارات موحّدة
│
├── data/
│   ├── yem_admin1.geojson     # حدود وأسماء المحافظات
│   ├── yem_admin2.geojson     # حدود وأسماء المديريات
│   ├── yem_field_data.geojson # الأحياء والحارات
│   └── stores.geojson         # المتاجر والمنتجات
│
└── css/
    ├── style.css              # تنسيقات الصفحة الرئيسية
    ├── dashboard.css          # تنسيقات لوحتي التحكم
    └── admin.css              # تنسيقات لوحة الإدارة
```

---

## التشغيل

1. افتح المجلد في **VS Code**
2. شغّل **Live Server** (أو أي خادم HTTP محلي)
3. الصفحات المتاحة:

| الصفحة | الرابط |
|---|---|
| الخريطة العامة | `index.html` |
| لوحة الإدارة | `admin.html` |
| دخول موحّد | `login.html` |
| لوحة التاجر | `login.html?redirect=merchant` |
| لوحة السوبر أدمن | `login.html?redirect=superadmin` |

> **ملاحظة:** لا تعمل `file://` المباشرة — يجب استخدام خادم HTTP محلي (Live Server أو ما يشبهه) لأنها تعمل بنظام **ES6 Modules**.

---

## بيانات الدخول

- **سوبر أدمن:** `superadmin` / `yusir@2024`
- **التجار:** يُنشئون من لوحة السوبر أدمن ويُخزّنون في `localStorage['yusir_merchants']`

---

## الأنماط المعمارية (Patterns)

| النمط | الملفات | الوصف |
|---|---|---|
| **Singleton** | `MapManager` | نسخة واحدة من الخريطة للمستخدم |
| **Observer** | `EventBus` | تواصل بين المكونات (السلة → واجهة، الطلب، التقييمات) |
| **Factory** | `MarkerFactory`, `PopupFactory` | إنشاء موحّد للماركرات والنوافذ |
| **Repository** | `StoreRepository`, `CartStorage`, `AuthService` | طبقة بيانات موحّدة |
| **Dependency Injection** | `main.js`, `admin-main.js` | حقن التبعيات عند بدء التشغيل |

جميع المكونات تفصل **Business Logic** (`*Service.js`) عن **UI** (`*UI.js`, `*Controller.js`).

---

## آلية العمل

### الخريطة
تعتمد على **Leaflet 1.9.4** مع طبقة OpenStreetMap:
- **المحافظات:** حدود رمادية عند التكبير ≥ 7
- **المديريات:** حدود خفيفة عند التكبير ≥ 9
- **الأحياء والحارات:** رقاقات 🏘️ حي / 📌 حارة عند التكبير ≥ 11
- **المتاجر:** أيقونات حمراء/رمادية مع نافذة منبثقة تعرض المنتجات
- **بحث Nominatim:** مربع بحث أعلى اليسار يبحث في اليمن بالعربية
- **معلومات الموقع:** كليك يمين على الخريطة يعرض اسم المنطقة من OpenStreetMap
- مقيدة بإحداثيات اليمن فقط (`maxBounds`)

### الجلسات
- **sessionStorage** لجلسات الدخول (تُمسح بإغلاق التبويب)
- تحويلة تلقائية إلى `login.html` عند فقدان الجلسة

### التخزين
| البيانات | الموقع |
|---|---|
| حسابات التجار | `localStorage['yusir_merchants']` |
| بيانات المتجر والمنتجات (للتاجر) | `localStorage['yusir_store_<id>']` |
| المتاجر الرسمية | `data/stores.geojson` |
| الأحياء والحارات | `data/yem_field_data.geojson` |
| الجلسات النشطة | `sessionStorage` |

---

## سير العمل

### إدارة التاجر (`merchant.html`)
- تعديل بيانات متجره (اسم، شعار بصيغة Base64، ...)
- إضافة/حذف المنتجات مع رفع صور من الجهاز (Base64)
- جميع الصور تُخزّن في `localStorage` (لا تحتاج روابط خارجية)

### إدارة السوبر أدمن (`super-admin.html`)
- إضافة/حذف التجار مع باقات (أساسي/احترافي/متقدم)
- تمديد الاشتراك، تعليق/تفعيل المتجر
- إحصائيات: إجمالي المتاجر، الفعّالة، المنتهية، الإيراد الشهري

### بيانات الحقل — الأحياء والحارات (`admin.html`)
1. اختر المديرية من القائمة (تُحمّل من `yem_admin2.geojson`)
2. اختر النوع (حي/حارة)
3. انقر على الخريطة لتحديد الموقع
4. أضف ← يظهر على الخريطة فوراً
5. يصدر `yem_field_data.geojson` لرفعه إلى المستودع

### إضافة متجر في الخريطة (`admin.html`)
1. انقر على الخريطة لتحديد الموقع
2. أدخل بيانات المتجر والمنتجات
3. احفظ ← يصدر `stores.geojson`

---

## تخصيص إضافي

- **ألوان الخريطة:** غيّر `.dist-label` و `.field-chip` في ملفات CSS
- **الحدود:** عدّل `maxBounds` في `src/core/config/app.js`
- **طبقات خريطة بديلة:** أضف `L.tileLayer` في `LayerManager` بـ `src/modules/map/LayerManager.js`
- **صورة افتراضية للمنتجات:** غيّر `defaults.productImage` في `src/core/config/app.js`
- **بيانات السوبر أدمن:** عدّل `auth.superAdmin` في `src/core/config/app.js`
- **حساب Nominatim:** البحث يستخدم API مجاني، للاستخدام الكثيف سجّل مفتاحاً خاصاً

---

> المشروع مبني لبيئة **Live Server** مع **ES6 Modules** ولا يدعم Backend. جميع العمليات طرفية (Client-side).
