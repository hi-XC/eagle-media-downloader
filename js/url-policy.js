const INSTAGRAM_HOSTS = ["instagram.com"];
const INSTAGRAM_MEDIA_HOSTS = ["cdninstagram.com", "fbcdn.net"];
const INSTAGRAM_POST_PATH = /^\/p\/([A-Za-z0-9_-]+)\/?$/;

function matchesDomain(hostname, domains) {
  const host = String(hostname || "").toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function parseInstagramPostUrl(value) {
  const parsed = new URL(String(value || "").trim());
  const pathMatch = parsed.pathname.match(INSTAGRAM_POST_PATH);

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    !matchesDomain(parsed.hostname, INSTAGRAM_HOSTS) ||
    !pathMatch
  ) {
    throw new TypeError("Unsupported Instagram post URL");
  }

  return { parsed, shortcode: pathMatch[1] };
}

function isInstagramPostUrl(value) {
  try {
    parseInstagramPostUrl(value);
    return true;
  } catch (error) {
    return false;
  }
}

function canonicalizeInstagramPostUrl(value) {
  const { shortcode } = parseInstagramPostUrl(value);
  return `https://www.instagram.com/p/${shortcode}/`;
}

function resolveInstagramRedirect(currentUrl, location) {
  const target = new URL(location, currentUrl);
  parseInstagramPostUrl(target.toString());
  target.hash = "";
  return target.toString();
}

function isAllowedInstagramMediaUrl(value) {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port &&
      matchesDomain(parsed.hostname, INSTAGRAM_MEDIA_HOSTS)
    );
  } catch (error) {
    return false;
  }
}

module.exports = {
  canonicalizeInstagramPostUrl,
  isAllowedInstagramMediaUrl,
  isInstagramPostUrl,
  matchesDomain,
  parseInstagramPostUrl,
  resolveInstagramRedirect,
};
