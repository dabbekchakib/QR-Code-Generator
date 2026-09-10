import type { Locale } from "./config";

type NestedMessages = {
  [key: string]: string | NestedMessages;
};

const messages: Record<Locale, NestedMessages> = {
  fr: {
    common: {
      appName: "QR Manager",
      tagline: "Créer. Personnaliser. Partager.",
      free: "100% Gratuit",
      freeForever: "Gratuit pour toujours. Pas d'abonnements. Pas de pubs.",
      createQR: "Créer un QR",
      myQRCodes: "Mes QR Codes",
      dashboard: "Tableau de bord",
      analytics: "Analytiques",
      templates: "Modèles",
      settings: "Paramètres",
      home: "Accueil",
      login: "Connexion",
      register: "Inscription",
      offline: "Hors ligne",
      online: "En ligne",
    },
    nav: {
      dashboard: "Tableau de bord",
      myQRCodes: "Mes QR Codes",
      createQR: "Créer un QR",
      analytics: "Analytiques",
      templates: "Modèles",
      settings: "Paramètres",
    },
    home: {
      heroTitle: "QR Manager",
      heroSubtitle: "Créer. Personnaliser. Partager.",
      heroDescription:
        "Créez, personnalisez et gérez vos QR Codes depuis une application simple et gratuite.",
      createQR: "Créer un QR",
      myQRCodes: "Mes QR Codes",
      freeBanner: "100% Gratuit • Pas d'abonnements • Pas de pubs",
      typesTitle: "Types de QR Codes",
      typesSubtitle: "Créez différents types de QR Codes selon vos besoins",
      featuresTitle: "Tout ce dont vous avez besoin",
      featuresSubtitle: "QR Manager combine puissance et simplicité",
    },
    qrTypes: {
      website: { name: "Site Web", desc: "Lien vers n'importe quel site web" },
      wifi: { name: "WiFi", desc: "Partagez votre connexion WiFi" },
      phone: { name: "Téléphone", desc: "Numéro de téléphone cliquable" },
      email: { name: "Email", desc: "Adresse email avec message pré-rempli" },
      whatsapp: { name: "WhatsApp", desc: "Lien direct vers WhatsApp" },
      vcard: { name: "vCard", desc: "Carte de contact professionnelle" },
      text: { name: "Texte", desc: "Message ou information textuelle" },
    },
    dashboard: {
      totalQRCodes: "Total QR Codes",
      totalScans: "Total Scans",
      todayScans: "Aujourd'hui",
      scansOverview: "Aperçu des scans",
      topQRCodes: "Top QR Codes",
    },
    create: {
      title: "Créer un QR Code",
      subtitle: "Choisissez le type de QR Code à créer",
      selectType: "Sélectionnez un type",
      configuration: "Configuration",
      label: "Libellé",
      isDynamic: "QR Dynamique",
      dynamicDesc: "Permet de modifier le contenu et suivre les scans",
    },
    settings: {
      title: "Paramètres",
      language: "Langue",
      theme: "Thème",
      darkMode: "Mode sombre",
      lightMode: "Mode clair",
    },
    features: {
      staticTitle: "QR Codes Statiques",
      staticDesc:
        "Créez des QR codes permanents pour vos liens, contacts et informations.",
      dynamicTitle: "QR Codes Dynamiques",
      dynamicDesc:
        "Modifiez le contenu de vos QR codes sans en créer de nouveaux.",
      analyticsTitle: "Analytiques",
      analyticsDesc:
        "Suivez les scans et comprenez l'utilisation de vos QR codes.",
      pwaTitle: "PWA / Hors ligne",
      pwaDesc:
        "Utilisez l'application même sans connexion internet.",
    },
  },
  en: {
    common: {
      appName: "QR Manager",
      tagline: "Create. Customize. Share.",
      free: "100% Free",
      freeForever: "Free forever. No subscriptions. No ads.",
      createQR: "Create QR",
      myQRCodes: "My QR Codes",
      dashboard: "Dashboard",
      analytics: "Analytics",
      templates: "Templates",
      settings: "Settings",
      home: "Home",
      login: "Login",
      register: "Register",
      offline: "Offline",
      online: "Online",
    },
    nav: {
      dashboard: "Dashboard",
      myQRCodes: "My QR Codes",
      createQR: "Create QR",
      analytics: "Analytics",
      templates: "Templates",
      settings: "Settings",
    },
    home: {
      heroTitle: "QR Manager",
      heroSubtitle: "Create. Customize. Share.",
      heroDescription:
        "Create, customize and manage QR Codes from one simple, free application.",
      createQR: "Create QR",
      myQRCodes: "My QR Codes",
      freeBanner: "100% Free • No subscriptions • No ads",
      typesTitle: "QR Code Types",
      typesSubtitle: "Create different types of QR Codes for your needs",
      featuresTitle: "Everything You Need",
      featuresSubtitle: "QR Manager combines power and simplicity",
    },
    qrTypes: {
      website: { name: "Website", desc: "Link to any website" },
      wifi: { name: "WiFi", desc: "Share your WiFi connection" },
      phone: { name: "Phone", desc: "Clickable phone number" },
      email: { name: "Email", desc: "Email address with pre-filled message" },
      whatsapp: { name: "WhatsApp", desc: "Direct link to WhatsApp" },
      vcard: { name: "vCard", desc: "Professional contact card" },
      text: { name: "Text", desc: "Text message or information" },
    },
    dashboard: {
      totalQRCodes: "Total QR Codes",
      totalScans: "Total Scans",
      todayScans: "Today",
      scansOverview: "Scans Overview",
      topQRCodes: "Top QR Codes",
    },
    create: {
      title: "Create QR Code",
      subtitle: "Choose the type of QR Code to create",
      selectType: "Select a type",
      configuration: "Configuration",
      label: "Label",
      isDynamic: "Dynamic QR",
      dynamicDesc: "Modify content and track scans",
    },
    settings: {
      title: "Settings",
      language: "Language",
      theme: "Theme",
      darkMode: "Dark mode",
      lightMode: "Light mode",
    },
    features: {
      staticTitle: "Static QR Codes",
      staticDesc:
        "Create permanent QR codes for your links, contacts and information.",
      dynamicTitle: "Dynamic QR Codes",
      dynamicDesc:
        "Change your QR code content without creating new ones.",
      analyticsTitle: "Analytics",
      analyticsDesc:
        "Track scans and understand your QR code usage.",
      pwaTitle: "PWA / Offline",
      pwaDesc:
        "Use the app even without an internet connection.",
    },
  },
  ar: {
    common: {
      appName: "QR Manager",
      tagline: "أنشئ. خصّص. شارك.",
      free: "مجاني 100%",
      freeForever: "مجاني للابد. لا اشتراكات. لا اعلانات.",
      createQR: "انشئ QR",
      myQRCodes: "QR Codes الخاصة بي",
      dashboard: "لوحة التحكم",
      analytics: "التحليلات",
      templates: "القوالب",
      settings: "الاعدادات",
      home: "الرئيسية",
      login: "تسجيل الدخول",
      register: "التسجيل",
      offline: "غير متصل",
      online: "متصل",
    },
    nav: {
      dashboard: "لوحة التحكم",
      myQRCodes: "QR Codes الخاصة بي",
      createQR: "انشئ QR",
      analytics: "التحليلات",
      templates: "القوالب",
      settings: "الاعدادات",
    },
    home: {
      heroTitle: "QR Manager",
      heroSubtitle: "أنشئ. خصّص. شارك.",
      heroDescription:
        "أنشئ وخصّص وأدر رموز QR من تطبيق واحد بسيط ومجاني.",
      createQR: "انشئ QR",
      myQRCodes: "QR Codes الخاصة بي",
      freeBanner: "مجاني 100% • لا اشتراكات • لا اعلانات",
      typesTitle: "انواع رموز QR",
      typesSubtitle: "انشئ انواع مختلفة من رموز QR حسب احتياجاتك",
      featuresTitle: "كل ما تحتاجه",
      featuresSubtitle: "QR Manager يجمع القوة والبساطة",
    },
    qrTypes: {
      website: { name: "موقع الويب", desc: "رابط الى اي موقع ويب" },
      wifi: { name: "WiFi", desc: "شارك اتصال WiFi الخاص بك" },
      phone: { name: "هاتف", desc: "رقم هاتف قابل للنقر" },
      email: { name: "بريد", desc: "عنوان بريد الكتروني مع رسالة مسبقة" },
      whatsapp: { name: "WhatsApp", desc: "رابط مباشر الى WhatsApp" },
      vcard: { name: "vCard", desc: "بطاقة اتصال مهنية" },
      text: { name: "نص", desc: "رسالة نصية او معلومات" },
    },
    dashboard: {
      totalQRCodes: "اجمالي QR Codes",
      totalScans: "اجمالي المسح",
      todayScans: "اليوم",
      scansOverview: "نظرة عامة على المسح",
      topQRCodes: "اكثر QR Codes استخداما",
    },
    create: {
      title: "انشئ رمز QR",
      subtitle: "اختر نوع رمز QR الانشئه",
      selectType: "اختر نوعا",
      configuration: "الاعدادات",
      label: "العنوان",
      isDynamic: "QR ديناميكي",
      dynamicDesc: "تعديل المحتوى وتتبع عمليات المسح",
    },
    settings: {
      title: "الاعدادات",
      language: "اللغة",
      theme: "المظهر",
      darkMode: "الوضع الداكن",
      lightMode: "الوضع الفاتح",
    },
    features: {
      staticTitle: "رموز QR الثابتة",
      staticDesc:
        "أنشئ رموز QR دائمة لروابطك وجهات اتصالك ومعلوماتك.",
      dynamicTitle: "رموز QR الديناميكية",
      dynamicDesc:
        "غيّر محتوى رموز QR بدون انشاء رموز جديدة.",
      analyticsTitle: "التحليلات",
      analyticsDesc:
        "تتبع عمليات المسح وافهم استخدام رموز QR الخاصة بك.",
      pwaTitle: "PWA / غير متصل",
      pwaDesc:
        "استخدم التطبيق حتى بدون اتصال بالانترنت.",
    },
  },
};

export function getTranslation(locale: Locale, path: string): string {
  const keys = path.split(".");
  let result: string | NestedMessages = messages[locale];

  for (const key of keys) {
    if (typeof result === "string") return path;
    result = result[key];
    if (!result) return path;
  }

  return typeof result === "string" ? result : path;
}

export type TranslationKey = string;
