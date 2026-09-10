// FAQPage structured data. Renders the JSON-LD Google/Bing/AI answer engines
// read to lift individual Q&As. Takes the same question/answer pairs already
// rendered on the page as a prop, rather than holding its own copy — schema
// that drifts from the visible text is exactly what gets structured data
// penalized or ignored.

type Faq = { question: string; answer: string };

export default function FaqSchema({ faqs }: { faqs: Faq[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
