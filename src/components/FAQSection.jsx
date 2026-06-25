import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './FAQSection.css';

const faqs = [
  {
    question: "How is Rail Compass different from other railway booking websites?",
    answer: "Unlike traditional platforms that just list trains by departure time, Rail Compass uses a smart algorithm to analyze duration, daytime efficiency, budget, and historical reliability to recommend the absolute best options tailored specifically for you."
  },
  {
    question: "What makes your recommendation engine unique?",
    answer: "Our algorithm goes beyond simple filters. It calculates a 'Smart Score' for each train, considering factors like minimizing overnight travel discomfort, balancing ticket cost with travel time, and accounting for typical delays on specific routes."
  },
  {
    question: "Does Rail Compass show trains that other websites don't?",
    answer: "While we use the same official railway data, our unique value is in surfacing hidden gems. We might recommend a slightly later train that reaches faster, or a route that offers better daylight travel, which other platforms often bury under pages of results."
  },
  {
    question: "Can I still search for trains manually?",
    answer: "Absolutely! We offer the standard search functionality, but our personalized top recommendations are always presented first to help you make a more informed decision without having to manually compare dozens of trains."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-section">
      <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Frequently Asked Questions</h2>
      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`faq-item glass-panel ${openIndex === index ? 'active' : ''}`}
            onClick={() => toggleFAQ(index)}
          >
            <div className="faq-question">
              <h3>{faq.question}</h3>
              {openIndex === index ? <ChevronUp className="faq-icon" /> : <ChevronDown className="faq-icon" />}
            </div>
            <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
