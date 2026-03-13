export type FaqCategory = "scoring" | "orders" | "integration" | "account" | "data";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  answerDarija: string;
  link?: string;
  linkLabel?: string;
}

export const categoryColors: Record<FaqCategory, string> = {
  scoring: "bg-emerald-100 text-emerald-700",
  orders: "bg-rose-100 text-rose-700",
  integration: "bg-sky-100 text-sky-700",
  account: "bg-violet-100 text-violet-700",
  data: "bg-amber-100 text-amber-700",
};

export const faqItems: FaqItem[] = [
  // --- Scoring ---
  {
    id: "score-calc",
    category: "scoring",
    question: "Comment nortoo calcule le score ?",
    answer:
      "Chaque commande démarre à un score de base de 25. Ensuite, 24 règles ajoutent ou retirent des points selon l'historique client, le montant, la zone géographique, l'adresse, l'heure, etc. Le score final (0-100) détermine la décision : expédier, vérifier, signaler ou bloquer.",
    answerDarija:
      "كل طلبية كتبدا من سكور 25. من بعد، 24 قاعدة كتزيد ولا كتنقص نقاط حسب تاريخ الكليان، المبلغ، المنطقة، العنوان، الوقت... السكور النهائي (0-100) هو لي كيقرر: شيبي، تحقق، سينيالي ولا بلوكي.",
    link: "/dashboard/guide#scoring",
    linkLabel: "Guide du scoring",
  },
  {
    id: "order-blocked",
    category: "scoring",
    question: "Pourquoi cette commande est bloquée ?",
    answer:
      "Ouvrez le détail de la commande pour voir la décomposition du score. Chaque règle ayant contribué est listée avec ses points. Si le score dépasse votre seuil de blocage (86 par défaut), la commande est bloquée automatiquement.",
    answerDarija:
      "حل الديتاي ديال الطلبية باش تشوف شنو زاد فالسكور. كل قاعدة لي زادت نقاط كتبان. إلا السكور فات السوي ديال البلوكاج (86 par défaut)، الطلبية كتبلوكا أوتوماتيكمون.",
    link: "/dashboard/orders",
    linkLabel: "Voir les commandes",
  },
  {
    id: "new-merchant",
    category: "scoring",
    question: "Le scoring est-il fiable pour un nouveau marchand ?",
    answer:
      "Au démarrage, l'indice de confiance est plus bas (0.40) car nortoo n'a pas encore d'historique. La fiabilité augmente rapidement avec le volume de commandes. Après quelques semaines, les données de vélocité et géographie affinent le scoring.",
    answerDarija:
      "فالبداية، مؤشر الثقة كيكون ضعيف (0.40) حيت nortoo مازال ما عندو تاريخ. الدقة كتزيد بزربة مع الطلبيات. مورا شي سيمانات، الداتا ديال السرعة والجغرافيا كتحسن السكور.",
    link: "/dashboard/analytics",
    linkLabel: "Voir les analytics",
  },
  {
    id: "adjust-thresholds",
    category: "scoring",
    question: "Comment ajuster les seuils de scoring ?",
    answer:
      "Allez dans Paramètres > Scoring. Vous pouvez déplacer les curseurs pour définir vos seuils de vérification, signalement et blocage. Des presets (Prudent, Équilibré, Agressif) sont aussi disponibles.",
    answerDarija:
      "سير لـ Paramètres > Scoring. تقدر تحرك les curseurs باش تحدد السويات ديال التحقق والسينيال والبلوكاج. كاين حتى presets جاهزين (Prudent, Équilibré, Agressif).",
    link: "/dashboard/settings?tab=scoring",
    linkLabel: "Paramètres scoring",
  },

  // --- Commandes ---
  {
    id: "force-ship",
    category: "orders",
    question: "Comment forcer l'expédition d'une commande ?",
    answer:
      "Depuis le détail de la commande, cliquez sur \"Forcer l'expédition\". L'action est enregistrée dans le journal d'audit avec votre identifiant. Utile quand vous connaissez personnellement le client.",
    answerDarija:
      "من الديتاي ديال الطلبية، كليكي على \"Forcer l'expédition\". الأكسيون كتسجل فـ journal d'audit بالإيدي ديالك. مفيدة إلا كنتي كتعرف الكليان.",
    link: "/dashboard/orders",
    linkLabel: "Voir les commandes",
  },
  {
    id: "blacklist",
    category: "orders",
    question: "Comment ajouter un numéro à la blacklist ?",
    answer:
      "Dans Paramètres > Scoring, section \"Liste noire\", ajoutez le numéro de téléphone. Les prochaines commandes de ce numéro seront automatiquement bloquées (score maximal).",
    answerDarija:
      "فـ Paramètres > Scoring، قسم \"Liste noire\"، زيد النوميرو ديال التيليفون. الطلبيات الجايين من هاد النوميرو غادي يتبلوكاو أوتوماتيك (سكور ماكسيمال).",
    link: "/dashboard/settings?tab=scoring",
    linkLabel: "Paramètres scoring",
  },
  {
    id: "export-data",
    category: "orders",
    question: "Comment exporter mes données ?",
    answer:
      "Sur la page Analytics, cliquez sur \"Exporter PDF\" pour un rapport mensuel complet. Vous pouvez aussi utiliser l'API pour récupérer les données programmatiquement.",
    answerDarija:
      "فـ صفحة Analytics، كليكي على \"Exporter PDF\" باش تاخد rapport شهري كامل. تقدر حتى تستعمل l'API باش تجبد الداتا بالكود.",
    link: "/dashboard/analytics",
    linkLabel: "Voir les analytics",
  },

  // --- Intégration ---
  {
    id: "webhook-broken",
    category: "integration",
    question: "Mon webhook ne fonctionne pas, que faire ?",
    answer:
      "Vérifiez le point de santé du webhook (indicateur vert/rouge dans le header). Si rouge : (1) vérifiez que votre boutique est connectée dans Paramètres > Boutique, (2) relancez le test webhook. Contactez support@nortoo.ma si ça persiste.",
    answerDarija:
      "شوف نقطة الصحة ديال الـ webhook (أخضر/أحمر فالهيدر). إلا حمرا: (1) تأكد بلي المحل كونيكتي فـ Paramètres > Boutique، (2) عاود test webhook. راسل support@nortoo.ma إلا بقا الموشكيل.",
    link: "/dashboard/settings?tab=integration",
    linkLabel: "Paramètres intégration",
  },
  {
    id: "connect-youcan",
    category: "integration",
    question: "Comment connecter ma boutique YouCan ?",
    answer:
      "Allez dans Paramètres > Intégration et cliquez \"Connecter YouCan\". Vous serez redirigé vers YouCan pour autoriser l'accès. Le webhook se configure automatiquement après la connexion.",
    answerDarija:
      "سير لـ Paramètres > Intégration وكليكي \"Connecter YouCan\". غادي يوجهك لـ YouCan باش تعطي l'autorisation. الـ webhook كيتكونفيغورا وحدو مورا الكونيكسيون.",
    link: "/dashboard/settings?tab=integration",
    linkLabel: "Paramètres intégration",
  },
  {
    id: "other-platform",
    category: "integration",
    question: "Puis-je utiliser nortoo avec une autre plateforme ?",
    answer:
      "Oui. Utilisez l'endpoint d'ingestion API (POST /api/webhook/ingest) pour envoyer vos commandes depuis n'importe quelle plateforme. Il suffit d'avoir une clé API nortoo.",
    answerDarija:
      "إيه. استعمل endpoint ديال l'API (POST /api/webhook/ingest) باش تصيفط الطلبيات من أي بلاتفورم. غير خاصك clé API ديال nortoo.",
    link: "/dashboard/guide#api",
    linkLabel: "Guide API",
  },
  {
    id: "api-key",
    category: "integration",
    question: "Où trouver ma clé API ?",
    answer:
      "Votre clé API est dans Paramètres > Intégration. Elle commence par nt_live_. Ne la partagez jamais publiquement. Vous pouvez la régénérer à tout moment.",
    answerDarija:
      "الكلي API ديالك فـ Paramètres > Intégration. كتبدا بـ nt_live_. ما تبارطاجيهاش أبدا. تقدر تجينيريها من جديد وقتما بغيتي.",
    link: "/dashboard/settings?tab=integration",
    linkLabel: "Paramètres intégration",
  },

  // --- Compte ---
  {
    id: "change-plan",
    category: "account",
    question: "Comment changer mon plan ?",
    answer:
      "Allez dans Paramètres > Facturation. Comparez les plans disponibles (Trial, Starter, Pro, Scale) et cliquez sur \"Changer\". Le changement prend effet immédiatement.",
    answerDarija:
      "سير لـ Paramètres > Facturation. قارن les plans (Trial, Starter, Pro, Scale) وكليكي على \"Changer\". التغيير كيدخل فالحين.",
    link: "/dashboard/settings?tab=billing",
    linkLabel: "Facturation",
  },
  {
    id: "add-team",
    category: "account",
    question: "Comment ajouter un membre à mon équipe ?",
    answer:
      "Dans Paramètres > Équipe, entrez l'email du collaborateur et choisissez son rôle. Il recevra un email d'invitation. Le nombre max dépend de votre plan (1 Starter, 3 Pro, 10 Scale).",
    answerDarija:
      "فـ Paramètres > Équipe، دخل الإيمايل ديال الكوليغ واختار le rôle ديالو. غادي يوصلو إيمايل. العدد الماكسيمال كيتبدل حسب le plan ديالك (1 Starter, 3 Pro, 10 Scale).",
    link: "/dashboard/settings?tab=team",
    linkLabel: "Gestion d'équipe",
  },
  {
    id: "contact-support",
    category: "account",
    question: "Comment contacter le support ?",
    answer:
      "Envoyez un email à support@nortoo.ma. Nous répondons en moins de 24 heures. Pour les urgences, précisez \"URGENT\" dans l'objet.",
    answerDarija:
      "صيفط إيمايل لـ support@nortoo.ma. كنجاوبو فأقل من 24 ساعة. إلا حالة مستعجلة، كتب \"URGENT\" فـ l'objet.",
  },

  // --- Données ---
  {
    id: "data-protection",
    category: "data",
    question: "Mes données sont-elles protégées ?",
    answer:
      "Oui. nortoo est conforme à la Loi 09-08 (protection des données personnelles). Les données sont hébergées en UE (Frankfurt), les téléphones sont hachés SHA-256 et jamais stockés en clair.",
    answerDarija:
      "إيه. nortoo كيحترم القانون 09-08 (حماية المعطيات الشخصية). الداتا مخزونة فـ أوروبا (فرانكفورت)، التيليفونات مشفرين بـ SHA-256 وما كيتحفظوش واضحين.",
    link: "/dashboard/compliance",
    linkLabel: "Conformité",
  },
  {
    id: "delete-data",
    category: "data",
    question: "Comment demander la suppression de mes données ?",
    answer:
      "Sur la page Conformité, soumettez une demande de droit d'accès ou de suppression. Vous pouvez aussi envoyer un email à support@nortoo.ma avec votre demande.",
    answerDarija:
      "فـ صفحة Conformité، صيفط طلب حق الوصول ولا الحذف. تقدر حتى تصيفط إيمايل لـ support@nortoo.ma بالطلب ديالك.",
    link: "/dashboard/compliance",
    linkLabel: "Conformité",
  },
  {
    id: "data-retention",
    category: "data",
    question: "Combien de temps mes données sont conservées ?",
    answer:
      "Les données sont conservées 24 mois conformément à l'article 3e de la Loi 09-08. Après ce délai, elles sont automatiquement supprimées. Vous pouvez demander une suppression anticipée.",
    answerDarija:
      "الداتا كتتحفظ 24 شهر حسب المادة 3e ديال القانون 09-08. مورا هاد المدة، كتتمسح أوتوماتيك. تقدر تطلب الحذف قبل الوقت.",
    link: "/dashboard/compliance",
    linkLabel: "Conformité",
  },
];
