export function FaqItem({
  q,
  children,
}: {
  q: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-medium text-midnight mb-1">{q}</p>
      <p className="text-fog">{children}</p>
    </div>
  );
}
