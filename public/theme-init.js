/**
 * Applies the stored colour-scheme choice before first paint.
 *
 * Loaded as a static file rather than an inline script so that no
 * `dangerouslySetInnerHTML` is required in the document head (Part 8.4) and so the
 * logic is cacheable and CSP-friendly.
 *
 * Precedence: an explicit user choice (localStorage) wins; otherwise the OS
 * preference is used. The resolved value is written to `data-theme` on <html>,
 * which the token layer in globals.css keys off.
 */
(function () {
  try {
    var stored = window.localStorage.getItem("fsjesc-fmc-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
      return;
    }
    document.documentElement.removeAttribute("data-theme");
  } catch (error) {
    // Private browsing modes can throw on localStorage access. Falling through
    // leaves the CSS media query in control, which is the correct default.
  }
})();
