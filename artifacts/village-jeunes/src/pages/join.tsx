import { ArrowLeft, Check, HeartHandshake, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', neighborhood: '', reason: '' });
  const setField = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-secondary text-secondary-foreground shadow-[5px_5px_0_hsl(var(--accent))]"><Check className="h-8 w-8" /></div>
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-secondary">Demande envoyée</p>
        <h1 className="vj-display mt-3 text-6xl leading-[.9]">À bientôt<br />sur la place.</h1>
        <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">Un voisin va regarder votre demande. Vous recevrez un email dès que le portail vous sera ouvert.</p>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background hover:-translate-y-0.5" data-testid="link-back-after-join"><ArrowLeft className="h-4 w-4" /> Retour au village</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
      <div className="vj-enter lg:sticky lg:top-28">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><HeartHandshake className="h-6 w-6" /></div>
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">La porte est ouverte</p>
        <h1 className="vj-display mt-3 text-6xl leading-[.86] sm:text-7xl">Venez<br /><em className="text-primary">comme vous êtes.</em></h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">Village Jeunes est un petit espace de confiance. Une vraie communauté, pas une course aux abonnés.</p>
        <div className="mt-8 border-l-2 border-accent pl-4 text-xs font-semibold leading-5 text-foreground/70">Les demandes sont relues par des membres du village avant chaque invitation.</div>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="vj-enter vj-enter-delay-1 rounded-[28px] border border-border bg-card p-6 shadow-md sm:p-9">
        <div className="mb-8"><h2 className="text-xl font-extrabold tracking-[-.04em]">Faire sa demande</h2><p className="mt-1 text-xs text-muted-foreground">Cela prend environ deux minutes.</p></div>
        <div className="space-y-5">
          <label className="block space-y-2 text-xs font-bold">Prénom et nom<input required minLength={2} value={form.name} onChange={(event) => setField('name', event.target.value)} className="field" placeholder="Comment vous appelle-t-on ?" data-testid="input-join-name" /></label>
          <label className="block space-y-2 text-xs font-bold">Email<input required type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className="field" placeholder="vous@exemple.fr" data-testid="input-join-email" /></label>
          <label className="block space-y-2 text-xs font-bold">Votre quartier<select required value={form.neighborhood} onChange={(event) => setField('neighborhood', event.target.value)} className="field" data-testid="select-join-neighborhood"><option value="">Choisir un quartier</option><option>La Place</option><option>Les Tilleuls</option><option>Le Verger</option><option>Les Vignes</option><option>Un autre coin</option></select></label>
          <label className="block space-y-2 text-xs font-bold">Qu’est-ce qui vous amène ?<textarea required minLength={10} rows={4} value={form.reason} onChange={(event) => setField('reason', event.target.value)} className="field resize-none" placeholder="Une passion, une idée, une envie de rencontrer…" data-testid="input-join-reason" /></label>
        </div>
        <button type="submit" className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-xs font-extrabold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg" data-testid="button-submit-join"><Send className="h-4 w-4" /> Envoyer ma demande</button>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold text-muted-foreground"><MapPin className="h-3 w-3" /> Uniquement pour les jeunes du village et des alentours.</p>
      </form>
    </div>
  );
}
