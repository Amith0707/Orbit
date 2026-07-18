// Deliberately outside React: the axios interceptor needs to read/write this
// synchronously without re-rendering, and keeping the access token out of
// localStorage/sessionStorage avoids the classic XSS-exfiltration vector.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
