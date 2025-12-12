(() => {
  const script = document.currentScript;
  const websiteId = script.getAttribute("data-website-id");
  const endpoint = "https://signal-ingest.ojas-singh02.workers.dev/ingest";

  function getVisitorId() {
    let visitorId = localStorage.getItem("_signal_vid");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("_signal_vid", visitorId);
    }
    return visitorId;
  }

  function track(event) {
    fetch(endpoint, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: websiteId,
        visitor_id: getVisitorId(),
        event,
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
        page_url: window.location.href,
        referrer: document.referrer || "",
        user_agent: navigator.userAgent || "",
      }),
    });
  }

  track("pageview");
  window.signal = { track };
})();
