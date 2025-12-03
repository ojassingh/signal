import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="grid h-screen grid-rows-12 place-content-center">
      <div className="row-start-4 mx-auto max-w-xl text-center">
        <h1 className="mt-4 text-5xl">
          Signal is an AI assistant for revenue analytics
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Signal studies your users while keeping your data safe to provide
          suggestions to get to product-market fit{" "}
          <span className="text-primary">fast</span>.
        </p>
        <div className="mt-6 flex place-content-center gap-2">
          <Button
            className="inset-shadow-primary inset-shadow-sm rounded-full text-white"
            variant="outline"
          >
            Start 14-day free trial
          </Button>
          <Button className="rounded-full" variant="outline">
            Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
