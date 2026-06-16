import { PageHero } from "@/components/PageHero";

const faqs = [
  {
    question: "How do I buy tickets?",
    answer: "Choose an event and click Buy Tickets. We will send you to the available ticketing source for that event."
  },
  {
    question: "Are tickets sold directly by DFW Live Events?",
    answer: "Not right now. DFW Live Events is currently a discovery directory that links to official or partner ticketing pages."
  },
  {
    question: "Why am I redirected to Ticketmaster or another ticketing site?",
    answer: "Ticket purchases are handled by external ticketing providers. The redirect helps you complete checkout with the source that manages the listing."
  },
  {
    question: "Can I list tickets for resale?",
    answer: "Not yet. Resale and seller accounts are planned for a later marketplace phase."
  },
  {
    question: "How do I contact DFW Live Events?",
    answer: "A contact channel is coming soon. For now, this page is a placeholder while the marketplace foundation is being built."
  }
];

export default function FAQsPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title={
          <>
            Questions before the <span className="accent">show?</span>
          </>
        }
        copy="Quick answers about tickets, redirects, resale, and the current DFW Live Events experience."
      />
      <section className="stack">
        {faqs.map((faq) => (
          <article className="detail-panel" key={faq.question}>
            <h2 className="section-title">{faq.question}</h2>
            <p className="muted">{faq.answer}</p>
          </article>
        ))}
      </section>
    </>
  );
}
