export const TOOLING_AUTH = {
  "0260": ["uv, Ruff and pytest project workflow", "python-tooling-workflow.html#uv"],
  "0295": ["pytest fixtures, parametrization and Ruff/uv CI workflow", "python-tooling-workflow.html#pytest"],
  "0055": ["Session tokens, headers, CSRF, XSS and logout boundaries", "token-session-lifecycle.html#browser"],
  "0326": ["Refresh token rotation, JWT, bearer tokens, OAuth and OIDC", "token-session-lifecycle.html#refresh"],
  "0328": ["SSO, SAML and multi-application session logout", "token-session-lifecycle.html#logout"],
};

export function toolingAuthMarkup(number) {
  const entry = TOOLING_AUTH[number];
  if (!entry) return "";
  return `<section class="card" data-tooling-auth="${number}"><h2>${entry[0]}</h2><p>Read the <a href="../reference/${entry[1]}" target="_blank" rel="noreferrer">worked explanation and practice sequence</a>, then predict the failure cases before running the offline exercise. Tool-dependent checks and identity-provider integrations are labelled separately.</p></section>`;
}
