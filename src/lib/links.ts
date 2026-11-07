// Builds a link that works under the site's base path, e.g. on GitHub Pages.
export function pageUrl(path = "") {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path}`;
}
