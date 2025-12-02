export function Hero() {
  return (
    <main className="grid h-screen grid-rows-12 place-content-center">
      <div className="row-start-4 mx-auto max-w-xl text-center">
        <h1 className="text-5xl">
          Signal is an AI assistant for revenue-first analytics
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Beyond showing you data, Signal studies your users to provide
          suggestions to get to product-market fit{" "}
          <span className="text-primary">fast</span>.
        </p>
      </div>
    </main>
  );
}
