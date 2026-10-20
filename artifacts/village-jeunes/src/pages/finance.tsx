import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetFinanceDashboardQueryKey,
  useGetFinanceDashboard,
  useUpdateFinanceContribution,
  useUpdateFinanceMonth,
  type FinanceContributionWrite,
  type FinanceMonthWrite,
} from "@workspace/api-client-react";
import { FinanceDashboardView } from "@/components/finance-dashboard-view";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonth);
  const [error, setError] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const dashboardQuery = useGetFinanceDashboard(
    { month },
    {
      query: {
        queryKey: getGetFinanceDashboardQueryKey({ month }),
        refetchInterval: 45_000,
        refetchOnWindowFocus: true,
      },
    },
  );
  const updateMonth = useUpdateFinanceMonth();
  const updateContribution = useUpdateFinanceContribution();

  const saveMonth = (data: FinanceMonthWrite) => {
    setError("");
    setSavingGoal(true);
    updateMonth.mutate(
      { monthKey: month, data },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getGetFinanceDashboardQueryKey({ month }),
          });
        },
        onError: () =>
          setError("L’objectif mensuel n’a pas pu être enregistré."),
        onSettled: () => setSavingGoal(false),
      },
    );
  };

  const saveContribution = (
    profileId: string,
    data: FinanceContributionWrite,
  ) => {
    setError("");
    setSavingProfileId(profileId);
    updateContribution.mutate(
      { monthKey: month, profileId, data },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getGetFinanceDashboardQueryKey({ month }),
          });
        },
        onError: () => setError("La cotisation n’a pas pu être enregistrée."),
        onSettled: () => setSavingProfileId(null),
      },
    );
  };

  if (dashboardQuery.isLoading) {
    return <div className="h-[70vh] animate-pulse rounded-[30px] bg-muted" />;
  }
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="rounded-[28px] border border-destructive/20 bg-card px-6 py-16 text-center">
        <h1 className="text-xl font-extrabold">Finances indisponibles</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Réessayez dans quelques instants.
        </p>
      </div>
    );
  }

  return (
    <FinanceDashboardView
      dashboard={dashboardQuery.data}
      month={month}
      onMonthChange={setMonth}
      editable={dashboardQuery.data.canManage}
      savingGoal={savingGoal}
      savingProfileId={savingProfileId}
      error={error}
      onUpdateMonth={saveMonth}
      onUpdateContribution={saveContribution}
    />
  );
}
