import type { Section } from "@/lib/listing-sections";
import { RichTextSection } from "./RichTextSection";
import { SpecsSection } from "./SpecsSection";
import { FeaturesSection } from "./FeaturesSection";
import { GallerySection } from "./GallerySection";
import { FaqSection } from "./FaqSection";
import { ChangelogSection } from "./ChangelogSection";

export function SectionRenderer({ section }: { section: Section }) {
  const components: Record<string, React.FC<{ content: any }>> = {
    richtext: RichTextSection,
    specs: SpecsSection,
    features: FeaturesSection,
    gallery: GallerySection,
    faq: FaqSection,
    changelog: ChangelogSection,
  };

  const Component = components[section.type];
  if (!Component) return null;

  return (
    <section className="mb-10">
      {section.title && (
        <h2 className="text-lg font-semibold text-zinc-800 mb-3">{section.title}</h2>
      )}
      <Component content={section.content} />
    </section>
  );
}
