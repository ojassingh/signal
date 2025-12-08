(() => {
  const script = document.currentScript;
  const websiteId = script.getAttribute("data-website-id");
  const endpoint = script.getAttribute("data-endpoint") || "";

  function getVisitorId() {
    let visitorId = localStorage.getItem("_signal_vid");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("_signal_vid", visitorId);
    }
    return visitorId;
  }

  function track(event) {
    const url = endpoint ? `${endpoint}/ingest` : "/api/ingest";
    fetch(url, {
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
