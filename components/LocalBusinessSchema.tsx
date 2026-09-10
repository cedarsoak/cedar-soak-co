// components/LocalBusinessSchema.tsx
//
// Site-wide LocalBusiness structured data. Renders a JSON-LD <script> tag.
// Import and drop this into app/layout.tsx (once, site-wide) so it's present
// on every page — this is what Google, Bing, and AI answer engines (AI
// Overviews, Copilot, ChatGPT/Perplexity search) read to understand who you
// are, where you serve, and how to contact you.

export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.cedarsoak.co/#business",
    name: "Cedar Soak Co.",
    alternateName: "CedarSoak",
    url: "https://www.cedarsoak.co",
    logo: "https://www.cedarsoak.co/logo-horizontal.svg",
    image: "https://www.cedarsoak.co/logo-horizontal.svg",
    description:
      "Cedar Soak Co. delivers handcrafted, wood-fired and electric cedar hot tubs to backyards, cabins, and celebrations across the Dayton, Ohio area. White-glove delivery, setup, and pickup included.",
    telephone: "+1-937-604-6399",
    email: "cedarsoak@gmail.com",
    priceRange: "$249–$747",
    currenciesAccepted: "USD",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dayton",
      addressRegion: "OH",
      addressCountry: "US",
    },
    areaServed: [
      { "@type": "City", name: "Dayton, OH" },
      { "@type": "City", name: "Kettering, OH" },
      { "@type": "City", name: "Beavercreek, OH" },
      { "@type": "City", name: "Centerville, OH" },
      { "@type": "City", name: "Miamisburg, OH" },
      { "@type": "City", name: "Huber Heights, OH" },
    ],
    sameAs: [
      "https://www.facebook.com/cedarsoakco",
      "https://www.instagram.com/cedarsoak",
    ],
    makesOffer: [
      {
        "@type": "Offer",
        name: "Wood-Fire Cedar Hot Tub Rental",
        priceCurrency: "USD",
        price: "249",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "249",
          priceCurrency: "USD",
          unitText: "DAY",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            minValue: 3,
            unitText: "DAY",
          },
        },
      },
      {
        "@type": "Offer",
        name: "Electric Cedar Hot Tub Rental",
        priceCurrency: "USD",
        price: "249",
      },
      {
        "@type": "Offer",
        name: "Hybrid Wood-Fire / Electric Cedar Hot Tub Rental",
        priceCurrency: "USD",
        price: "249",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
