import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Feedback';
import Brand from '@/components/ui/Brand';
import { useSettings } from '@/context/SettingsContext';

const CONTENT = {
    privacy: {
        title: 'Privacy Policy',
        sections: [
            ['What we collect', 'Name, email, student number, program, year level, school email, contact number and a photograph — only what is needed to issue and verify a student ID. Home addresses and emergency contacts are not collected unless the institution enables them.'],
            ['How it is used', 'To verify your identity as a student, to issue your digital ID, and to let authorized staff manage student records. Data is not sold or used for advertising.'],
            ['Who can see it', 'You can see your own record. Registrar staff and administrators can see records according to their role. Anyone scanning your QR code sees only whether the ID is valid and a minimal identity chosen by your institution.'],
            ['Retention', 'Records are archived rather than deleted so that the audit trail stays intact. The institution’s retention schedule determines when archived records are permanently removed.'],
            ['Your choices', 'You may update contact details at any time and request corrections to verified details through the portal.'],
        ],
    },
    terms: {
        title: 'Terms of Use',
        sections: [
            ['Acceptable use', 'Use the system only for your own student identity. Do not share your login, and do not present another person’s ID.'],
            ['Accuracy', 'You are responsible for submitting accurate information. Submitting false information may result in rejection or revocation of the ID and disciplinary action.'],
            ['ID ownership', 'A digital ID remains the property of the institution and may be suspended or revoked when justified.'],
            ['Availability', 'The service is provided as is. Staff may perform maintenance that temporarily limits access.'],
        ],
    },
};

export default function LegalPage({ kind }) {
    const { title, sections } = CONTENT[kind];
    const s = useSettings();

    return (
        <div className="min-h-screen bg-paper">
            <header className="border-b border-line bg-white">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
                    <Brand />
                    <Link to="/" className="text-sm font-semibold text-teal-700 hover:underline">
                        ← Home
                    </Link>
                </div>
            </header>
            <main className="mx-auto max-w-3xl px-5 py-12">
                <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">{title}</h1>
                <p className="mt-2 text-sm text-slate-500">{s.institution_name} · {s.department_name}</p>

                <Alert tone="warning" title="Template text" className="mt-6">
                    This is placeholder wording for development. Before real use, the institution must supply approved policy text after its own
                    legal and data-privacy review.
                </Alert>

                <div className="mt-8 space-y-8">
                    {sections.map(([h, p]) => (
                        <section key={h}>
                            <h2 className="font-display text-xl font-semibold text-ink">{h}</h2>
                            <p className="mt-2 leading-relaxed text-slate-700">{p}</p>
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
}
