/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSEO from "@/components/seo/PageSEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const faqCategories = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "What is JustAChat?",
          a: "JustAChat is a private chat platform designed for adults who want real conversation without the noise and pressure of modern social media. We offer public chat rooms, encrypted private messaging, voice and video chat, dating features, and AI bot companions. Our platform combines the nostalgic simplicity of classic chat rooms with modern security and features."
        },
        {
          q: "Is JustAChat free to use?",
          a: "Yes! JustAChat is completely free to use. All core features including chat rooms, private messaging, voice chat, and basic customization are available at no cost. We're a community-supported platform that relies on donations rather than ads or subscription fees."
        },
        {
          q: "How do I create an account?",
          a: "Creating an account is simple: visit our signup page, enter your desired username, email address, and password. You'll receive a verification email to confirm your account. Once verified, you can immediately start chatting in any public room or send private messages to other users."
        },
        {
          q: "What's the minimum age to use JustAChat?",
          a: "JustAChat is an adults-only platform. Users must be at least 18 years old to create an account. We take this seriously and reserve the right to remove accounts that violate our age requirements. Some chat rooms have additional age restrictions."
        }
      ]
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "Are my private messages encrypted?",
          a: "Yes! All private messages on JustAChat use end-to-end encryption. This means only you and the person you're messaging can read your conversations—not even JustAChat administrators can access the content of your private chats. Your privacy is our top priority."
        },
        {
          q: "Does JustAChat sell my data?",
          a: "Absolutely not. We will never sell, share, or monetize your personal data. Unlike major social media platforms, we don't collect data for advertising purposes. We only collect the minimum information necessary to provide our services, and it stays strictly confidential."
        },
        {
          q: "How can I delete my account?",
          a: "You can delete your account at any time through your profile settings. Account deletion is permanent and will remove all your data from our servers, including messages, profile information, and any content you've shared. This action cannot be undone."
        },
        {
          q: "What is Ghost Mode?",
          a: "Ghost Mode is a privacy feature that makes you appear offline to other users. When enabled, you won't show up in member lists or as online to friends, but you can still browse and participate in chats. It's perfect for when you want to observe without being noticed."
        }
      ]
    },
    {
      category: "Chat Features",
      questions: [
        {
          q: "What chat rooms are available?",
          a: "JustAChat offers a variety of themed chat rooms including General, Lounge, Adults, Sports, Politics, Technology, Music, Movies, Dating, Help, Games, and Trivia. Each room has its own topic and community. Room owners can also create custom rooms with specific themes and rules."
        },
        {
          q: "Can I create my own chat room?",
          a: "Yes! Registered users can create their own chat rooms. As a room creator, you become the room owner with full administrative control. You can set room passwords, customize appearance, appoint moderators, and establish rules for your community."
        },
        {
          q: "How do voice and video chat work?",
          a: "Our voice and video features let you take conversations beyond text. You can join voice-enabled rooms for group audio, start private voice calls with friends, or enable video chat for face-to-face conversations. All audio and video streams use secure WebRTC technology."
        },
        {
          q: "What are AI Bot Companions?",
          a: "AI Bot Companions are intelligent chat bots that can engage in natural conversation. They're available 24/7 when you want someone to talk to, can discuss various topics, and some even support voice conversations. They're great for practicing social skills or just having fun."
        }
      ]
    },
    {
      category: "Dating Features",
      questions: [
        {
          q: "How does the dating feature work?",
          a: "Our dating feature lets you create a dating profile separate from your chat profile. Set your preferences for age, gender, and what you're looking for. Browse profiles and swipe right on people you're interested in. When both users swipe right, it's a match and you can start a private conversation."
        },
        {
          q: "Is my dating profile public?",
          a: "Your dating profile is only visible to other users who have opted into the dating feature. It's separate from your main chat profile, so you control what information potential matches can see. You can enable or disable your dating profile at any time."
        }
      ]
    },
    {
      category: "Moderation & Safety",
      questions: [
        {
          q: "How is JustAChat moderated?",
          a: "We use a combination of AI-powered content moderation and human moderators to keep JustAChat safe. Our systems detect and filter inappropriate content, while our moderation team handles reports and maintains community standards. Room owners can also appoint their own moderators."
        },
        {
          q: "How do I report a user?",
          a: "To report a user, click on their username to view their profile and select the 'Report' option. Choose the reason for your report and provide any additional details. Our moderation team reviews all reports and takes appropriate action, which may include warnings, mutes, or bans."
        },
        {
          q: "Can I block someone?",
          a: "Yes! You can block any user to prevent them from messaging you or seeing your activity. Blocked users won't be notified that they've been blocked. You can manage your blocked users list in your profile settings and unblock anyone at any time."
        },
        {
          q: "What are the community guidelines?",
          a: "Our community guidelines prohibit harassment, hate speech, spam, illegal content, and predatory behavior. We expect all users to treat each other with respect and engage in good faith. Violations can result in warnings, temporary mutes, or permanent bans. Full guidelines are available on our Community Guidelines page."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "Is there a mobile app?",
          a: "JustAChat is fully responsive and works great on mobile browsers. We also offer a desktop application for Windows, Mac, and Linux. Native mobile apps for iOS and Android are in development and will be released soon."
        },
        {
          q: "Can I use JustAChat with mIRC?",
          a: "Yes! JustAChat supports IRC protocol connections through our mIRC integration. You can connect using traditional IRC clients while still enjoying our web platform features. Check our mIRC Connect page for setup instructions and our custom theme package."
        },
        {
          q: "I forgot my password. How do I reset it?",
          a: "On the login page, click 'Forgot Password' and enter your email address. You'll receive an email with a secure link to reset your password. The link expires after 24 hours for security. If you don't receive the email, check your spam folder or contact support."
        },
        {
          q: "Who do I contact for help?",
          a: "You can reach our support team through the Help page on JustAChat. We also have a dedicated Help room where moderators and community members can assist with common questions. For urgent issues or account problems, use our support ticket system."
        }
      ]
    }
  ];

  // Generate FAQ Schema.org structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqCategories.flatMap(category => 
      category.questions.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    )
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about JustAChat: how to sign up, chat features, privacy, mIRC integration, and more. Get started with our free private chat platform."
        path="/faq"
        keywords="justachat faq, chat help, how to use justachat, private chat questions, chat room help"
      />
      {/* FAQ Schema */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">JustAChat™</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
            <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Join Now</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about JustAChat. Can't find an answer? Visit our Help page or ask in the Help chat room.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {faqCategories.map((category, categoryIndex) => (
          <section key={categoryIndex} className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4">{category.category}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {category.questions.map((faq, faqIndex) => (
                <AccordionItem 
                  key={faqIndex} 
                  value={`${categoryIndex}-${faqIndex}`}
                  className="bg-card border border-border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left text-foreground hover:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        {/* Still Have Questions */}
        <section className="mt-12 text-center py-8 px-6 bg-card rounded-lg border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our community is here to help. Join the Help room for real-time assistance or browse our detailed Help documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/help" 
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Visit Help Center
            </Link>
            <Link 
              to="/chat/Help" 
              className="inline-block px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              Join Help Room
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default FAQ;
