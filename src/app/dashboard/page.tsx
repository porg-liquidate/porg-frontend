import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { LiquidateCard } from "@/components/dashboard/liquidate-card"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
// import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col bg-black p-4">
      <DashboardHeader />

      <div className="container py-6">
        <h1 className="mb-6 text-3xl font-bold text-white">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Suspense fallback={<DashboardSkeleton />}>
              <PortfolioOverview />
            </Suspense>
          </div>

          <div>
            <LiquidateCard />
          </div>
        </div>

        {/* <div className="mt-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <TransactionHistory />
          </Suspense>
        </div> */}
      </div>
    </main>
  )
}
