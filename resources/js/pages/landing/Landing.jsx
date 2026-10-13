import { useEffect } from 'react';
import { Footer, Nav } from './Chrome';
import Hero from './Hero';
import { Faq, Features, FinalCta, HowItWorks, Security, Showcase } from './Sections';

export default function Landing() {
    useEffect(() => {
        document.title = 'Student Digital ID — CPSU-SCC · College of Computer Studies';
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <a href="#features" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2">
                Skip to content
            </a>
            <Nav />
            <main>
                <Hero />
                <Features />
                <HowItWorks />
                <Showcase />
                <Security />
                <Faq />
                <FinalCta />
            </main>
            <Footer />
        </div>
    );
}
