import type { ChangelogEntry, FaqItem, Section, SpecItem } from "@/lib/listing-sections";
import { RichTextSection } from "./RichTextSection";
import { SpecsSection } from "./SpecsSection";
import { FeaturesSection } from "./FeaturesSection";
import { GallerySection } from "./GallerySection";
import { FaqSection } from "./FaqSection";
import { ChangelogSection } from "./ChangelogSection";

function RenderSectionContent({ section }: { section: Section }) {
  switch (section.type) {
    case "richtext":
      return <RichTextSection content={section.content as string} />;
    case "specs":
      return <SpecsSection content={section.content as SpecItem[]} />;
    case "features":
      return <FeaturesSection content={section.content as string[]} />;
    case "gallery":
      return <GallerySection content={section.content as string[]} />;
    case "faq":
      return <FaqSection content={section.content as FaqItem[]} />;
    case "changelog":
      return <ChangelogSection content={section.content as ChangelogEntry[]} />;
  }
}

export function SectionRenderer({ section }: { section: Section }) {
  return (
    <section className="mb-10">
      {section.title && (
        <h2 className="mb-3 text-lg font-semibold text-zinc-800">{section.title}</h2>
      )}
      <RenderSectionContent section={section} />
    </section>
  );
}
