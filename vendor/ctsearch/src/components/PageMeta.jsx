import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import topLogo from "../assets/topLogo.jpeg";

const SITE_NAME = "OncoSuite";
const DEFAULT_DESCRIPTION =
  "OncoSuite provides precision oncology intelligence for trial benchmarking, feasibility, and strategic development decisions.";
const SOCIAL_IMAGE = "/og-image.svg";
const INDEXABLE_ROBOTS =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

function upsertMeta(selector, attributes) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });

  return tag;
}

function upsertLink(selector, attributes) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("link");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });

  return tag;
}

function upsertScript(id, json) {
  let tag = document.head.querySelector(`script#${id}`);

  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.id = id;
    document.head.appendChild(tag);
  }

  tag.textContent = JSON.stringify(json);
  return tag;
}

export default function PageMeta({
  title,
  description,
  robots = INDEXABLE_ROBOTS,
  canonical = true,
  titleTemplate = true,
}) {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = title
      ? titleTemplate
        ? `${title} | ${SITE_NAME}`
        : title
      : SITE_NAME;
    const pageDescription = description || DEFAULT_DESCRIPTION;
    const absoluteUrl = `${window.location.origin}${pathname}`;
    const imageUrl = `${window.location.origin}${SOCIAL_IMAGE}`;
    const isIndexable = !robots.includes("noindex");

    document.title = pageTitle;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: pageDescription,
    });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: robots,
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: pageTitle,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: pageDescription,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "website",
    });
    upsertMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: "en_US",
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME,
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: absoluteUrl,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: imageUrl,
    });
    upsertMeta('meta[property="og:image:alt"]', {
      property: "og:image:alt",
      content: `${SITE_NAME} social preview image`,
    });
    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: pageTitle,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: pageDescription,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: imageUrl,
    });
    upsertMeta('meta[name="twitter:image:alt"]', {
      name: "twitter:image:alt",
      content: `${SITE_NAME} social preview image`,
    });
    upsertMeta('meta[name="theme-color"]', {
      name: "theme-color",
      content: "#0B1020",
    });

    if (canonical) {
      if (!isIndexable) {
        document.head.querySelector('link[rel="canonical"]')?.remove();
      } else {
        upsertLink('link[rel="canonical"]', {
          rel: "canonical",
          href: absoluteUrl,
        });
      }
    }

    if (isIndexable) {
      upsertScript("oncosuite-ld-json", {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${window.location.origin}/#organization`,
            name: SITE_NAME,
            url: window.location.origin,
            logo: `${window.location.origin}${topLogo}`,
            image: imageUrl,
          },
          {
            "@type": "WebSite",
            "@id": `${window.location.origin}/#website`,
            url: window.location.origin,
            name: SITE_NAME,
            publisher: {
              "@id": `${window.location.origin}/#organization`,
            },
          },
          {
            "@type": "WebPage",
            name: pageTitle,
            url: absoluteUrl,
            description: pageDescription,
            isPartOf: {
              "@id": `${window.location.origin}/#website`,
            },
            about: {
              "@id": `${window.location.origin}/#organization`,
            },
          },
        ],
      });
    } else {
      document.head.querySelector("#oncosuite-ld-json")?.remove();
    }
  }, [canonical, description, pathname, robots, title, titleTemplate]);

  return null;
}
