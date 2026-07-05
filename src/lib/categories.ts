// Preset categories offered in the listing form's Type dropdown.
// Category is stored as a free-form string (see the listings API), so this list
// is just a convenience — sellers can also pick "Other…" and type their own.
export const CATEGORIES = [
  "Web app",
  "Mobile app",
  "Desktop app",
  "AI agent",
  "Chatbot",
  "Automation",
  "API / Backend",
  "Browser extension",
  "Prompt/template",
  "Component / UI kit",
  "Plugin / Extension",
  "Game",
  "Data / Analytics",
  "Script / Tool",
  "Template / Boilerplate",
] as const;

// Sentinel select value that reveals the free-form category input.
export const OTHER_CATEGORY = "__other__";
