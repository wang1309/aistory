/**
 * FAQ Section Type Definitions
 * Used for internationalized FAQ components
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCTASection {
  title: string;
  description: string;
  button: string;
}

export interface FAQSection {
  title: string;
  description: string;
  faqs: FAQItem[];
  cta: FAQCTASection;
}
