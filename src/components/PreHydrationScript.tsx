import Script from "next/script";

/**
 * Pre-hydration script that reads localStorage and sets `html.dark`,
 * `html.variation-a|b`, `html.quiet-motion` before React hydrates.
 * Prevents theme/variation flash. Requires suppressHydrationWarning
 * on <html> because the className will differ between server and client.
 */
const script = `
(function(){
  try {
    var t = localStorage.getItem('nsmt-theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
    var v = localStorage.getItem('nsmt-variation');
    if (v !== 'b') v = 'a';
    document.documentElement.classList.remove('variation-a', 'variation-b');
    document.documentElement.classList.add('variation-' + v);
    if (localStorage.getItem('nsmt-quiet-motion') === '1') {
      document.documentElement.classList.add('quiet-motion');
    }
  } catch (e) {}
})();
`;

export function PreHydrationScript() {
  return (
    <Script id="nsmt-pre-hydration" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
