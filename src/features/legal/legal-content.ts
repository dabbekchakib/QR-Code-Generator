import { defaultLocale, rtlLocales, locales, type Locale } from "@/i18n/config";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPageContent {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function getLegalLocale(cookieValue: string | undefined): Locale {
  if (cookieValue && locales.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }
  return defaultLocale;
}

export const LOCALE_COOKIE = "qr-manager-locale";

export const legalUiLabels: Record<Locale, { updatedLabel: string; backHome: string }> = {
  fr: { updatedLabel: "Dernière mise à jour :", backHome: "Retour à l'accueil" },
  en: { updatedLabel: "Last updated:", backHome: "Back to home" },
  ar: { updatedLabel: "آخر تحديث:", backHome: "العودة إلى الرئيسية" },
};

export function resolveLegalContent(
  kind: "privacy" | "terms",
  cookieValue: string | undefined
): LegalPageContent {
  return legalContent[getLegalLocale(cookieValue)][kind];
}

/**
 * Static legal pages. The text is intentionally written for the current
 * product behavior: local IndexedDB storage, optional Supabase account, scan
 * analytics limited to type/OS/browser, locale + auth cookies only. No
 * legal compliance is claimed beyond what the app actually does.
 */
export const legalContent: Record<
  Locale,
  { privacy: LegalPageContent; terms: LegalPageContent }
> = {
  fr: {
    privacy: {
      title: "Politique de confidentialité",
      description:
        "Ce que QR Manager collecte, et ce qu'il ne collecte jamais.",
      lastUpdated: "12 septembre 2026",
      sections: [
        {
          heading: "1. Données que nous traitons",
          paragraphs: [
            "Les QR Codes statiques (contenu que vous saisissez) sont générés et enregistrés localement dans votre navigateur (IndexedDB). Ils ne sont jamais envoyés à nos serveurs.",
            "Si vous créez un compte, nous traitons votre adresse e-mail et un mot de passe chiffré via Supabase Auth. Tant que vous êtes connecté, vos QR Codes peuvent être synchronisés dans votre espace de stockage Supabase dédié.",
            "Analyses des QR Codes dynamiques : nombre de scans, type d'appareil (mobile / ordinateur), système d'exploitation et navigateur. Nous ne collectons ni adresse IP, ni agent utilisateur complet, ni localisation précise, ni donnée permettant de vous identifier personnellement.",
            "Cookies : uniquement une préférence de langue (qr-manager-locale) et la session d'authentification Supabase. Aucun cookie publicitaire ni traceur tiers.",
          ],
        },
        {
          heading: "2. Utilisation des données",
          paragraphs: [
            "Les données servent exclusivement au fonctionnement de l'application : génération, stockage, synchronisation et statistiques de scans. Nous ne vendons aucune donnée et ne diffusons aucune publicité.",
          ],
        },
        {
          heading: "3. Partage des données",
          paragraphs: [
            "Les redirections des QR Codes dynamiques passent par notre service de redirection. Supabase est notre seul sous-traitant (authentification et stockage). Aucun autre tiers n'accède à vos données.",
          ],
        },
        {
          heading: "4. Conservation",
          paragraphs: [
            "Vos données locales restent sur votre appareil jusqu'à ce que vous les effaciez (Paramètres) ou que le navigateur purge son stockage. Les données de compte sont conservées tant que le compte existe ; la suppression de compte arrivant en option prochaine, vous pouvez nous contacter pour toute demande.",
          ],
        },
        {
          heading: "5. Vos droits",
          paragraphs: [
            "Vous pouvez exporter ou effacer vos données locales à tout moment depuis les Paramètres. Pour toute demande concernant vos données de compte, contactez-nous à l'adresse ci-dessous.",
          ],
        },
        {
          heading: "6. Sécurité",
          paragraphs: [
            "L'application est servie en HTTPS, applique une politique de sécurité de contenu, et l'accès aux données Supabase est restreint au niveau des lignes. Les mots de passe sont gérés par Supabase Auth.",
          ],
        },
        {
          heading: "7. Enfants",
          paragraphs: [
            "QR Manager n'est pas destiné aux personnes de moins de 13 ans.",
          ],
        },
        {
          heading: "8. Modifications",
          paragraphs: [
            "Cette page peut être mise à jour ; la poursuite de l'utilisation après modification vaut acceptation.",
          ],
        },
        {
          heading: "9. Contact",
          paragraphs: ["dabbekchakib@gmail.com"],
        },
      ],
    },
    terms: {
      title: "Conditions d'utilisation",
      description:
        "Les règles d'utilisation de QR Manager, claires et brèves.",
      lastUpdated: "12 septembre 2026",
      sections: [
        {
          heading: "1. Acceptation",
          paragraphs: [
            "En utilisant QR Manager, vous acceptez les présentes conditions.",
          ],
        },
        {
          heading: "2. Description du service",
          paragraphs: [
            "QR Manager est une application web progressive permettant de générer des QR Codes : statiques, stockés localement sur votre appareil, et dynamiques (avec redirection) pour les comptes.",
          ],
        },
        {
          heading: "3. Compte",
          paragraphs: [
            "Vous êtes responsable de l'exactitude des informations de votre compte et de la confidentialité de vos identifiants.",
          ],
        },
        {
          heading: "4. Utilisation acceptable",
          paragraphs: [
            "Vous vous engagez à ne pas utiliser le service pour du contenu illégal, des destinations malveillantes (malware, hameçonnage), du spam de scans, ni de façon à porter atteinte aux droits de tiers ou de nos serveurs de redirection.",
          ],
        },
        {
          heading: "5. QR Codes dynamiques",
          paragraphs: [
            "Vous contrôlez la destination de vos QR Codes dynamiques. Les redirections passent par notre service ; nous pouvons suspendre les codes abusant du service.",
          ],
        },
        {
          heading: "6. Propriété intellectuelle",
          paragraphs: [
            "L'application et son code appartiennent à QR Manager. Vos contenus vous appartiennent ; vous nous accordez les droits nécessaires à leur stockage, synchronisation et redirection.",
          ],
        },
        {
          heading: "7. Disponibilité",
          paragraphs: [
            "Le service est fourni avec effort raisonnable, sans garantie de disponibilité continue. Nous vous recommandons d'exporter régulièrement vos données.",
          ],
        },
        {
          heading: "8. Limitation de responsabilité",
          paragraphs: [
            "Dans les limites autorisées par la loi, QR Manager ne pourra être tenu responsable de dommages indirects liés à l'utilisation du service.",
          ],
        },
        {
          heading: "9. Suspension",
          paragraphs: [
            "Nous pouvons suspendre un compte qui enfreint les présentes conditions.",
          ],
        },
        {
          heading: "10. Droit applicable",
          paragraphs: [
            "Les présentes conditions sont régies par le droit applicable au siège de l'éditeur.",
          ],
        },
        {
          heading: "11. Contact",
          paragraphs: ["dabbekchakib@gmail.com"],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      description: "What QR Manager collects, and what it never collects.",
      lastUpdated: "September 12, 2026",
      sections: [
        {
          heading: "1. Data we process",
          paragraphs: [
            "Static QR codes (the content you enter) are generated and stored locally in your browser (IndexedDB). They are never sent to our servers.",
            "If you create an account, we process your email address and an encrypted password via Supabase Auth. While signed in, your QR codes may be synced to your dedicated Supabase storage.",
            "Dynamic QR code analytics: scan count, device type (mobile / desktop), operating system and browser. We never collect IP addresses, full user agents, precise location, or personally identifying data.",
            "Cookies: only a language preference (qr-manager-locale) and the Supabase session. No advertising or third-party tracking cookies.",
          ],
        },
        {
          heading: "2. How we use data",
          paragraphs: [
            "Data is used solely to operate the app: generation, storage, sync and scan statistics. We sell no data and show no advertising.",
          ],
        },
        {
          heading: "3. Data sharing",
          paragraphs: [
            "Dynamic QR redirections go through our redirect service. Supabase is our only processor (auth and storage). No other third party accesses your data.",
          ],
        },
        {
          heading: "4. Retention",
          paragraphs: [
            "Your local data stays on your device until you clear it (Settings) or the browser removes its storage. Account data is kept while the account exists; account deletion is an upcoming option, so contact us for any request.",
          ],
        },
        {
          heading: "5. Your rights",
          paragraphs: [
            "You can export or clear your local data at any time from Settings. For any request regarding account data, contact us at the address below.",
          ],
        },
        {
          heading: "6. Security",
          paragraphs: [
            "The app is served over HTTPS, applies a Content Security Policy, and Supabase data access is restricted at the row level. Passwords are handled by Supabase Auth.",
          ],
        },
        {
          heading: "7. Children",
          paragraphs: ["QR Manager is not intended for people under 13."],
        },
        {
          heading: "8. Changes",
          paragraphs: [
            "This page may be updated; continued use after a change constitutes acceptance.",
          ],
        },
        {
          heading: "9. Contact",
          paragraphs: ["dabbekchakib@gmail.com"],
        },
      ],
    },
    terms: {
      title: "Terms of Use",
      description: "The rules for using QR Manager, kept clear and short.",
      lastUpdated: "September 12, 2026",
      sections: [
        {
          heading: "1. Acceptance",
          paragraphs: ["By using QR Manager you agree to these terms."],
        },
        {
          heading: "2. Service description",
          paragraphs: [
            "QR Manager is a progressive web app that generates QR codes: static ones stored locally on your device, and dynamic ones (with redirects) for accounts.",
          ],
        },
        {
          heading: "3. Account",
          paragraphs: [
            "You are responsible for the accuracy of your account information and for keeping your credentials confidential.",
          ],
        },
        {
          heading: "4. Acceptable use",
          paragraphs: [
            "You must not use the service for illegal content, malicious destinations (malware, phishing), scan spam, or in a way that harms third-party rights or our redirect servers.",
          ],
        },
        {
          heading: "5. Dynamic QR codes",
          paragraphs: [
            "You control the destination of your dynamic QR codes. Redirects go through our service; we may suspend codes that abuse it.",
          ],
        },
        {
          heading: "6. Intellectual property",
          paragraphs: [
            "The app and its code belong to QR Manager. Your content belongs to you; you grant us the rights needed to store, sync and redirect it.",
          ],
        },
        {
          heading: "7. Availability",
          paragraphs: [
            "The service is provided with reasonable effort and without a guarantee of continuous availability. We recommend exporting your data regularly.",
          ],
        },
        {
          heading: "8. Liability limitation",
          paragraphs: [
            "To the extent permitted by law, QR Manager will not be liable for indirect damages related to the use of the service.",
          ],
        },
        {
          heading: "9. Suspension",
          paragraphs: [
            "We may suspend an account that violates these terms.",
          ],
        },
        {
          heading: "10. Governing law",
          paragraphs: [
            "These terms are governed by the law applicable at the operator's place of business.",
          ],
        },
        {
          heading: "11. Contact",
          paragraphs: ["dabbekchakib@gmail.com"],
        },
      ],
    },
  },
  ar: {
    privacy: {
      title: "سياسة الخصوصية",
      description: "ما تجمعه QR Manager وما لا تجمعه أبدا.",
      lastUpdated: "12 سبتمبر 2026",
      sections: [
        {
          heading: "1. البيانات التي نعالجها",
          paragraphs: [
            "يتم توليد رموز QR الثابتة (المحتوى الذي تدخله) وتخزينها محليا في متصفحك (IndexedDB). لا تُرسل أبدا إلى خوادمنا.",
            "إذا أنشأت حسابا، نعالج بريدك الإلكتروني وكلمة مرور مشفرة عبر Supabase Auth. وعند تسجيل الدخول، قد تتم مزامنة رموز QR الخاصة بك في مساحة تخزين Supabase المخصصة.",
            "تحليلات رموز QR الديناميكية: عدد المسحات، نوع الجهاز (جوال / حاسوب)، نظام التشغيل والمتصفح. لا نجمع عناوين IP ولا وكلاء مستخدم كاملة ولا مواقع دقيقة ولا بيانات تعرّف بك شخصيا.",
            "ملفات تعريف الارتباط: تفضيل اللغة فقط (qr-manager-locale) وجلسة Supabase. لا توجد ملفات إعلانية أو تتبع من أطراف ثالثة.",
          ],
        },
        {
          heading: "2. استخدام البيانات",
          paragraphs: [
            "تُستخدم البيانات حصريا لتشغيل التطبيق: التوليد والتخزين والمزامنة وإحصاءات المسح. لا نبيع أي بيانات ولا نعرض إعلانات.",
          ],
        },
        {
          heading: "3. مشاركة البيانات",
          paragraphs: [
            "تمر عمليات إعادة توجيه رموز QR الديناميكية عبر خدمة إعادة التوجيه لدينا. Supabase هو المعالج الوحيد لدينا (المصادقة والتخزين). لا يصل طرف ثالث آخر إلى بياناتك.",
          ],
        },
        {
          heading: "4. الاحتفاظ",
          paragraphs: [
            "تبقى بياناتك المحلية على جهازك حتى تمسحها (الإعدادات) أو يزيل المتصفح تخزينه. تُحتفظ ببيانات الحساب ما دام الحساب موجودا؛ وحذف الحساب خيار قادم، لذا تواصل معنا لأي طلب.",
          ],
        },
        {
          heading: "5. حقوقك",
          paragraphs: [
            "يمكنك تصدير بياناتك المحلية أو مسحها في أي وقت من الإعدادات. ولأي طلب يتعلق ببيانات الحساب، تواصل معنا على العنوان أدناه.",
          ],
        },
        {
          heading: "6. الأمان",
          paragraphs: [
            "يُقدَّم التطبيق عبر HTTPS، ويطبق سياسة أمان المحتوى، وقيود الوصول إلى بيانات Supabase على مستوى الصفوف. تُدار كلمات المرور بواسطة Supabase Auth.",
          ],
        },
        {
          heading: "7. الأطفال",
          paragraphs: ["QR Manager غير موجّه للأشخاص دون 13 عاما."],
        },
        {
          heading: "8. التغييرات",
          paragraphs: [
            "قد تُحدَّث هذه الصفحة؛ ومتابعة الاستخدام بعد التغيير تعني القبول.",
          ],
        },
        {
          heading: "9. التواصل",
          paragraphs: ["dabbekchakib@gmail.com"],
        },
      ],
    },
    terms: {
      title: "شروط الاستخدام",
      description: "قواعد استخدام QR Manager، بوضوح واختصار.",
      lastUpdated: "12 سبتمبر 2026",
      sections: [
        {
          heading: "1. القبول",
          paragraphs: ["باستخدامك QR Manager فأنت توافق على هذه الشروط."],
        },
        {
          heading: "2. وصف الخدمة",
          paragraphs: [
            "QR Manager تطبيق ويب تقدمي لتوليد رموز QR: ثابتة تُخزن محليا على جهازك، وديناميكية (مع إعادة توجيه) للحسابات.",
          ],
        },
        {
          heading: "3. الحساب",
          paragraphs: [
            "أنت مسؤول عن دقة معلومات حسابك وعن سرية بيانات الدخول.",
          ],
        },
        {
          heading: "4. الاستخدام المقبول",
          paragraphs: [
            "يجب ألا تستخدم الخدمة لمحتوى غير قانوني، أو وجهات خبيثة (برمجيات ضارة، تصيد)، أو إرسال مسح ضار، أو بأي طريقة تضر بحقوق الأطراف الثالثة أو بخوادم إعادة التوجيه لدينا.",
          ],
        },
        {
          heading: "5. رموز QR الديناميكية",
          paragraphs: [
            "تتحكم في وجهة رموز QR الديناميكية الخاصة بك. تمر عمليات إعادة التوجيه عبر خدمتنا؛ وقد نعلّق الرموز التي تسيء استخدامها.",
          ],
        },
        {
          heading: "6. الملكية الفكرية",
          paragraphs: [
            "التطبيق ورمزه ملك لـ QR Manager. محتواك ملك لك؛ وتمنحنا الحقوق اللازمة لتخزينه ومزامنته وإعادة توجيهه.",
          ],
        },
        {
          heading: "7. التوفر",
          paragraphs: [
            "تُقدَّم الخدمة بجهد معقول ودون ضمان توفر مستمر. نوصي بتصدير بياناتك بانتظام.",
          ],
        },
        {
          heading: "8. حدود المسؤولية",
          paragraphs: [
            "في حدود ما يسمح به القانون، لن تكون QR Manager مسؤولة عن أضرار غير مباشرة مرتبطة باستخدام الخدمة.",
          ],
        },
        {
          heading: "9. التعليق",
          paragraphs: ["قد نعلّق حسابات تخالف هذه الشروط."],
        },
        {
          heading: "10. القانون الواجب التطبيق",
          paragraphs: [
            "تخضع هذه الشروط للقانون الساري في مقر عمل المشغّل.",
          ],
        },
        {
          heading: "11. التواصل",
          paragraphs: ["dabbekchakib@gmail.com"],
        },
      ],
    },
  },
};

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}