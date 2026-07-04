export type SectionType = "richtext" | "specs" | "features" | "gallery" | "faq" | "changelog";

export type SpecItem = { label: string; value: string };
export type FaqItem = { question: string; answer: string };
export type ChangelogEntry = { version: string; date: string; notes: string };

export type Section = {
  id: string;
  type: SectionType;
  title: string;
  content: string | SpecItem[] | string[] | FaqItem[] | ChangelogEntry[];
  order: number;
};

export function createDefaultSection(type: SectionType, order: number): Section {
  const id = crypto.randomUUID() as string;
  let title: string;
  let content: Section["content"];
  switch (type) {
    case "richtext":
      title = "Description";
      content = "";
      break;
    case "specs":
      title = "Specifications";
      content = [] as SpecItem[];
      break;
    case "features":
      title = "Features";
      content = [] as string[];
      break;
    case "gallery":
      title = "Gallery";
      content = [] as string[];
      break;
    case "faq":
      title = "FAQ";
      content = [] as FaqItem[];
      break;
    case "changelog":
      title = "Changelog";
      content = [] as ChangelogEntry[];
      break;
  }
  return { id, type, title, content, order };
}

export function sectionLabel(type: SectionType): string {
  const labels: Record<SectionType, string> = {
    richtext: "Rich Text",
    specs: "Specifications",
    features: "Features",
    gallery: "Gallery",
    faq: "FAQ",
    changelog: "Changelog",
  };
  return labels[type];
}

export function parseReadme(readme: string): Section[] {
  const sections: Section[] = [];
  const blocks = readme.split(/^## .+/m);
  const headings = readme.match(/^## .+/gm) ?? [];

  let order = 0;

  const before = blocks[0]?.trim();
  if (before) {
    sections.push({
      id: crypto.randomUUID() as string,
      type: "richtext",
      title: "README",
      content: before,
      order: order++,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const title = headings[i].replace(/^## /, "").trim();
    const content = blocks[i + 1]?.trim() || "";
    if (!title && !content) continue;
    sections.push({
      id: crypto.randomUUID() as string,
      type: "richtext",
      title,
      content,
      order: order++,
    });
  }

  return sections;
}
