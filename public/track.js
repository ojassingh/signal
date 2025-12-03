(() => {
  const script = document.currentScript;
  const websiteId = script.getAttribute("data-website-id");

  function getVisitorId() {
    let visitorId = localStorage.getItem("_signal_vid");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("_signal_vid", visitorId);
    }
    return visitorId;
  }

  function track(event, props = {}) {
    const url = new URL(window.location.href);

    fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: websiteId,
        visitor_id: getVisitorId(),
        event,
        path: url.pathname,
        referrer: document.referrer || null,
        utm_source: url.searchParams.get("utm_source"),
        utm_medium: url.searchParams.get("utm_medium"),
        utm_campaign: url.searchParams.get("utm_campaign"),
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        language: navigator.language,
        ua: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...props,
      }),
    });
  }

  track("pageview");
  window.signal = { track };
})();
