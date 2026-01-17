import { useState } from "react";
import { HelpCircle, ChevronDown, Mail } from "lucide-react";

export function FAQSection() {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const faqs = [
        {
            question: "How does the validation machine work?",
            answer:
                "We don't just 'analyze'. We run your problem statement through a 6-phase adversarial stress-test. 1) Discovery & Problem Anatomy. 2) Strategic Design & Roadmap. 3) AI Toolkit & Prompts. 4) Risk Assessment & ROI. 5) Competitor War Room. 6) Go-to-Market Plan. It's not advice; it's a simulation of your product's market reality.",
        },
        {
            question: "Is my IP safe?",
            answer:
                "Your ideas are processed in an ephemeral, encrypted environment. We are not a VC firm; we don't pick winners, we build them. Your IP remains 100% yours, analyzed by machines, not humans.",
        },
        {
            question: "What exactly do I get?",
            answer:
                "Zero fluff. You get a dense, tactical markdown report. Executive Summary, Market Math, Competitor Kill-Chain, Tech Stack, 10 Production-Ready Figma Prompts, and a Risk Matrix. It's the document you wish you had before you started coding.",
        },
        {
            question: "Can I upgrade later?",
            answer:
                "No. Each tier triggers a different depth of cognitive processing. The Syndicate tier doesn't just add more text; it uses a more expensive, deeper reasoning chain (APEX). Choose the level of certainty you can afford.",
        },
        {
            question: "Refund policy?",
            answer:
                "Since we burn significant GPU compute to generate your unique strategy instantly, all sales are final. We provided a full Demo Analysis so you know exactly what the output looks like. We sell certainty, not refunds.",
        },
        {
            question: "Is this better than a human consultant?",
            answer:
                "A human consultant costs $15k, takes 4 weeks, and gives you their opinion. ValidateStrategy costs $99, takes 24 hours, and gives you data-backed patterns from Nielsen Norman & Baymard. You decide which is better math.",
        },
        {
            question: "Why should I trust this?",
            answer:
                "Don't. Trust the logic. Read the demo. If you can't see the value of validatng your idea for the price of a dinner, you probably shouldn't be building a startup.",
        },
        {
            question: "Who is this for?",
            answer:
                "Founders who value their time. If you'd rather spend 6 months building the wrong thing than 24 hours validating the right thing, this isn't for you.",
        },
    ];

    return (
        <section className="py-32 relative z-10">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-6">
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Knowledge Base</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4 ">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground">Everything you need to know about the protocol.</p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <div key={index} className="faq-item group">
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${expandedFaq === index
                                        ? 'bg-indigo-500/20 text-indigo-400'
                                        : 'bg-muted/50 text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-400'
                                        }`}>
                                        <span className="font-mono text-xs font-bold">0{index + 1}</span>
                                    </div>
                                    <span className="font-medium">{faq.question}</span>
                                </div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedFaq === index
                                    ? 'bg-indigo-500/20 rotate-180'
                                    : 'bg-transparent group-hover:bg-muted/50'
                                    }`}>
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </button>
                            {expandedFaq === index && (
                                <div className="px-6 pb-5 pt-0">
                                    <div className="pl-11 text-muted-foreground text-sm leading-relaxed border-l-2 border-indigo-500/30 ml-[3px]">
                                        <p className="pl-4">{faq.answer}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground mb-3">Still have questions?</p>
                    <a
                        href="mailto:contact@validatestrategy.com"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Support
                    </a>
                </div>
            </div>
        </section>
    );
}
