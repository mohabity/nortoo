import {
  BookOpen,
  Rocket,
  LayoutDashboard,
  ShoppingCart,
  Brain,
  BarChart3,
  Settings,
  Code2,
  CreditCard,
  Shield,
  HelpCircle,
} from "lucide-react";

export const SECTIONS = [
  { id: "bienvenue", label: "Bienvenue", icon: BookOpen },
  { id: "premiers-pas", label: "Premiers pas", icon: Rocket },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "commandes", label: "Commandes", icon: ShoppingCart },
  { id: "scoring", label: "Scoring", icon: Brain },
  { id: "analytique", label: "Analytique", icon: BarChart3 },
  { id: "parametres", label: "Paramètres", icon: Settings },
  { id: "api", label: "Intégration API", icon: Code2 },
  { id: "facturation", label: "Facturation", icon: CreditCard },
  { id: "conformite", label: "Conformité", icon: Shield },
  { id: "faq", label: "FAQ", icon: HelpCircle },
] as const;

export type Section = (typeof SECTIONS)[number];
