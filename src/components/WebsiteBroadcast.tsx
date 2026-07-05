import { prisma } from "@/lib/prisma";

export async function WebsiteBroadcast() {
  const websites = await prisma.sellerWebsite.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  if (websites.length === 0) return null;

  const items = websites.map((website) => ({
    ...website,
    sellerName: website.user.name || "a VibeMarket maker",
  }));

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
                    {new URL(website.url).hostname.replace(/^www\./, "")} ↗
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
