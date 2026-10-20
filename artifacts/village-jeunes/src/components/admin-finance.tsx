import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminFinanceDashboardQueryKey,
  type FinanceContributionWrite,
  type FinanceMonthWrite,
  useGetAdminFinanceDashboard,
  useUpdateAdminFinanceContribution,
  useUpdateAdminFinanceMonth,
} from "@workspace/api-client-react";
import { FinanceDashboardView } from "@/components/finance-dashboard-view";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function AdminFinance() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonth);
  const [error, setError] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const dashboardQuery = useGetAdminFinanceDashboard(
    { month },
    {
      query: {
        retry: false,
        queryKey: getGetAdminFinanceDashboardQueryKey({ month }),
      },
    },
  );
  const updateMonth = useUpdateAdminFinanceMonth();
  const updateContribution = useUpdateAdminFinanceContribution();

  const saveMonth = (data: FinanceMonthWrite) => {
    setError("");
    setSavingGoal(true);
    updateMonth.mutate(
      { monthKey: month, data },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getGetAdminFinanceDashboardQueryKey({ month }),
          });
        },
        onError: () =>
          setError("L’objectif financier n’a pas pu être enregistré."),
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
            queryKey: getGetAdminFinanceDashboardQueryKey({ month }),
          });
        },
        onError: () => setError("La cotisation n’a pas pu être enregistrée."),
        onSettled: () => setSavingProfileId(null),
      },
    );
  };

  if (dashboardQuery.isLoading) {
    return <div className="h-80 animate-pulse rounded-[28px] bg-muted" />;
  }
  if (!dashboardQuery.data) {
    return (
      <p className="rounded-[28px] border border-destructive/20 bg-card p-8 text-sm text-destructive">
        Le tableau financier ne peut pas être chargé.
      </p>
    );
  }

  return (
    <FinanceDashboardView
      dashboard={dashboardQuery.data}
      month={month}
      onMonthChange={setMonth}
      editable
      savingGoal={savingGoal}
      savingProfileId={savingProfileId}
      error={error}
      onUpdateMonth={saveMonth}
      onUpdateContribution={saveContribution}
    />
  );
}
