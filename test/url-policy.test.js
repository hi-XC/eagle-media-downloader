const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canonicalizeInstagramPostUrl,
  isAllowedInstagramMediaUrl,
  isInstagramPostUrl,
  resolveInstagramRedirect,
} = require("../js/url-policy");

test("accepts only HTTPS Instagram /p/ links", () => {
  const accepted = [
    "https://instagram.com/p/ABC123/",
    "https://www.instagram.com/p/ABC_123-/?img_index=2",
    "https://m.instagram.com/p/ABC123",
  ];
  const rejected = [
    "http://www.instagram.com/p/ABC123/",
    "https://www.instagram.com/reel/ABC123/",
    "https://www.instagram.com/p/ABC123/comments/",
    "https://instagram.com.evil.test/p/ABC123/",
    "https://localhost/p/ABC123/",
    "https://127.0.0.1/p/ABC123/",
    "https://169.254.169.254/p/ABC123/",
    "https://192.168.1.1/p/ABC123/",
    "https://user:pass@instagram.com/p/ABC123/",
    "https://instagram.com:8443/p/ABC123/",
  ];

  accepted.forEach((url) => assert.equal(isInstagramPostUrl(url), true, url));
  rejected.forEach((url) => assert.equal(isInstagramPostUrl(url), false, url));
  assert.equal(
    canonicalizeInstagramPostUrl(accepted[1]),
    "https://www.instagram.com/p/ABC_123-/",
  );
});

test("allows redirects only to another supported Instagram post URL", () => {
  const current = "https://www.instagram.com/p/ABC123/";

  assert.equal(
    resolveInstagramRedirect(current, "/p/DEF456/?img_index=1"),
    "https://www.instagram.com/p/DEF456/?img_index=1",
  );
  assert.throws(() => resolveInstagramRedirect(current, "/accounts/login/"));
  assert.throws(() => resolveInstagramRedirect(current, "https://example.com/p/DEF456/"));
  assert.throws(() => resolveInstagramRedirect(current, "http://instagram.com/p/DEF456/"));
  assert.throws(() => resolveInstagramRedirect(current, "https://127.0.0.1/private"));
});

test("allows only HTTPS Instagram media delivery hosts", () => {
  assert.equal(isAllowedInstagramMediaUrl("https://scontent.cdninstagram.com/a.jpg"), true);
  assert.equal(isAllowedInstagramMediaUrl("https://scontent.xx.fbcdn.net/a.jpg"), true);
  assert.equal(isAllowedInstagramMediaUrl("http://scontent.cdninstagram.com/a.jpg"), false);
  assert.equal(isAllowedInstagramMediaUrl("https://cdninstagram.com.evil.test/a.jpg"), false);
  assert.equal(isAllowedInstagramMediaUrl("https://127.0.0.1/a.jpg"), false);
});
