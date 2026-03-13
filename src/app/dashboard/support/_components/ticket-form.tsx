"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n/provider";

interface TicketFormProps {
  onSubmit: (data: {
    subject: string;
    description: string;
    category: string;
    priority: string;
  }) => Promise<void>;
  compact?: boolean;
}

const CATEGORIES = ["scoring", "orders", "integration", "billing", "other"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;

export function TicketForm({ onSubmit, compact }: TicketFormProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.length < 5 || description.length < 10) return;
    setSubmitting(true);
    try {
      await onSubmit({ subject, description, category, priority });
      setSubject("");
      setDescription("");
      setCategory("other");
      setPriority("normal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subject */}
      <div>
        <label className="block text-xs font-medium text-fog mb-1">
          {t("support.form.subject")}
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("support.form.subjectPlaceholder")}
          required
          minLength={5}
          className="w-full px-3 py-2 rounded-sm border border-silk bg-white text-sm text-midnight placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-fog mb-1">
          {t("support.form.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("support.form.descriptionPlaceholder")}
          required
          minLength={10}
          rows={compact ? 3 : 4}
          className="w-full px-3 py-2 rounded-sm border border-silk bg-white text-sm text-midnight placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
        />
      </div>

      {/* Category + Priority */}
      <div className={compact ? "space-y-3" : "grid grid-cols-2 gap-3"}>
        <div>
          <label className="block text-xs font-medium text-fog mb-1">
            {t("support.form.category")}
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`support.categories.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-fog mb-1">
            {t("support.form.priority")}
          </label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`support.priority.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={submitting || subject.length < 5 || description.length < 10}
        className="w-full"
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("support.form.submit")}
      </Button>
    </form>
  );
}
