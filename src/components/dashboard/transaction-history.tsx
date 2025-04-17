import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDownUp, ExternalLink } from "lucide-react"

// Sample transaction data
const transactions = [
  {
    id: "tx1",
    type: "Liquidation",
    date: "2025-04-14",
    time: "10:23 AM",
    tokens: "5 tokens → USDC",
    amount: "$8.55",
    status: "Completed",
    signature: "5Gn7...9xUz",
  },
  {
    id: "tx2",
    type: "Liquidation",
    date: "2025-04-10",
    time: "2:45 PM",
    tokens: "3 tokens → SOL",
    amount: "$12.30",
    status: "Completed",
    signature: "3Kp8...7tRy",
  },
  {
    id: "tx3",
    type: "Bridge",
    date: "2025-04-05",
    time: "9:17 AM",
    tokens: "USDC → Ethereum",
    amount: "$25.00",
    status: "Completed",
    signature: "7Lm2...4qWz",
  },
]

export function TransactionHistory() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent liquidations and bridges</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="bg-secondary/10 text-secondaryborder border-white/10">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ArrowDownUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{tx.type}</p>
                    <Badge variant={tx.type === "Bridge" ? "outline" : "default"} className="text-xs">
                      {tx.tokens}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tx.date} at {tx.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{tx.amount}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.signature.substring(0, 4)}...{tx.signature.substring(tx.signature.length - 4)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
