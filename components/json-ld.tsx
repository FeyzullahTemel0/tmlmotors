export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // "<" karakteri kaçırılarak script bloğundan çıkış engellenir.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
