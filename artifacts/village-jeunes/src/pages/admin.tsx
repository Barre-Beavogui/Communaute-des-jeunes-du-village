import { Check, Clock3, Mail, MapPin, ShieldCheck, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListModerationRequestsQueryKey, useListModerationRequests, useReviewModerationRequest } from '@workspace/api-client-react';
import { demoRequests } from '@/lib/demo-data';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const requestsQuery = useListModerationRequests();
  const reviewRequest = useReviewModerationRequest();
  const [reviewed, setReviewed] = useState<Record<string, 'approved' | 'rejected'>>({});
  const requests = (requestsQuery.data ?? demoRequests).filter((request) => !reviewed[request.id]);

  const review = (id: string, status: 'approved' | 'rejected') => {
    setReviewed((current) => ({ ...current, [id]: status }));
    reviewRequest.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListModerationRequestsQueryKey() }),
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="vj-enter flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">Le petit portail</p><h1 className="vj-display mt-2 text-6xl leading-[.88]">Ouvrir la porte.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Chaque demande mérite un vrai regard. Ici, on accueille les nouveaux voisins avec attention.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold shadow-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-accent/60 text-primary">{requests.length}</span> demande{requests.length > 1 ? 's' : ''} à regarder</div>
      </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />Les demandes restent privées. Une fois validé, le jeune pourra compléter son portrait dans le recensement de Zoboroma.</div>
      {requestsQuery.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div className="h-28 animate-pulse rounded-2xl bg-muted" key={item} data-testid={`skeleton-request-${item}`} />)}</div> : requests.length ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="vj-enter flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center" data-testid={`row-request-${request.id}`}>
              <div className="flex items-center gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-sm font-extrabold text-secondary">{request.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><h2 className="font-extrabold tracking-[-.03em]" data-testid={`text-request-name-${request.id}`}>{request.name}</h2><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-muted-foreground"><span className="flex items-center gap-1"><Mail className="h-3 w-3" />{request.email}</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{request.neighborhood}</span><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{new Date(request.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></div></div></div>
              <div className="flex gap-2 sm:shrink-0"><button type="button" onClick={() => review(request.id, 'rejected')} disabled={reviewRequest.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50 sm:flex-none" data-testid={`button-reject-${request.id}`}><X className="h-4 w-4" /> Refuser</button><button type="button" onClick={() => review(request.id, 'approved')} disabled={reviewRequest.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 sm:flex-none" data-testid={`button-approve-${request.id}`}><Check className="h-4 w-4" /> Accueillir</button></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-20 text-center" data-testid="empty-moderation"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/50 text-primary"><UserRound className="h-6 w-6" /></div><h2 className="vj-display mt-5 text-4xl">La place est calme.</h2><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Aucune demande en attente. Profitez-en pour aller saluer les visages du village.</p></div>
      )}
      {requestsQuery.isError && <p className="text-xs font-semibold text-muted-foreground" data-testid="status-moderation-fallback">Mode aperçu actif : les demandes affichées sont des exemples locaux.</p>}
    </div>
  );
}
