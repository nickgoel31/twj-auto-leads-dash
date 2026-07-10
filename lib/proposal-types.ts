export interface ProposalSection {
  heading: string;
  content: string;
  listItems?: string[];
  orderedList?: string[];
}

export interface PricingRow {
  name: string;
  price: string;
  billing: string;
  description: string;
}

export interface ParsedProposal {
  title: string;
  sections: ProposalSection[];
  pricingRows: PricingRow[];
  totalInvestment: string;
  timeline: string[];
  nextSteps: string[];
}

export interface ProposalMeta {
  clientName: string;
  clientCategory: string;
  clientCity: string;
  clientPhone: string;
  generatedAt: string;
}
