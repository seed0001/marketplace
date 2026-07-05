import { prisma } from "@/lib/prisma";

// Rendered in the root layout, so this runs on every page — including the
// static pages Next prerenders at build time, when the database is NOT
// reachable (Railway's Postgres only exists at runtime). Any failure here must
// degrade to "no broadcast" rather than crash the render, or the whole build
// fails on /_not-found.
async function getWebsites() {
  try {
    return await prisma.sellerWebsite.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
  } catch {
    return [];
  }
}

// Parse a hostname without throwing on a malformed/relative URL.
function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function WebsiteBroadcast() {
  const websites = await getWebsites();

  const items = websites
    .map((website) => ({
      ...website,
      sellerName: website.user.name || "a VibeMarket maker",
      host: safeHostname(website.url),
    }))
    // Drop entries whose URL can't be parsed — they'd otherwise crash render.
    .filter((website) => website.host !== null);

  if (items.length === 0) return null;

  return (
    <aside aria-label="Seller website broadcast" className="broadcast-bar">
      <div className="broadcast-live">
        <span className="broadcast-pulse" aria-hidden="true" />
        SITE STREAM
      </div>
      <div className="broadcast-window">
        <div className="broadcast-track">
          {[0, 1].map((copy) => (
            <div className="broadcast-sequence" aria-hidden={copy === 1} key={copy}>
              {items.map((website) => (
                <a
                  key={`${copy}-${website.id}`}
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="broadcast-item"
                  tabIndex={copy === 1 ? -1 : undefined}
                >
                  <span className="broadcast-blip" aria-hidden="true">◆</span>
                  <span className="broadcast-copy">
                    <strong>Check out {website.title}</strong>
                    <span>{website.description}</span>
                    <span className="broadcast-seller">by {website.sellerName}</span>
                  </span>
                  <span className="broadcast-link">
                    {website.host} ↗
                  </span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
