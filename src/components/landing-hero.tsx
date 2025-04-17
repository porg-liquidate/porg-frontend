import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import "../App.css";
import logo from '../../public/images/lightlogo.png'

export function LandingHero() {
  return (
    <section className="relative flex flex-col justify-center items-center overflow-hidden bg-black w-full lg:h-screen p-4">
      <header className="relative w-full border-b border-secondary/10 mb-2 h-20 lg:h-auto">
            <img
              src={logo}
              alt="Logo"
              width={100}
              height={100}
              className="rounded-md absolute lg:-top-23 -top-5"
            />
      </header>
      <div className="absolute inset-0" />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold text-secondary tracking-tight sm:text-5xl md:text-6xl">
            Liquidate Your Entire Portfolio With One Click
          </h1>
          <p className="mb-10 text-md text-muted">
            Convert all your tokens, including dust, into a single asset
            instantly. Save time, reduce fees, and simplify your crypto
            experience on Solana.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 hover:text-secondary text-secondary font-semibold transition-colors duration-200"
            >
              <a href="/board">
                Try It Now <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <p className="text-3xl font-bold text-secondary">$0.0001</p>
              <p className="text-sm text-muted-foreground">Average Fee</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <p className="text-3xl font-bold text-secondary">1 Second</p>
              <p className="text-sm text-muted-foreground">Transaction Time</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <p className="text-3xl font-bold text-secondary">100%</p>
              <p className="text-sm text-muted-foreground">Dust Recovery</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
