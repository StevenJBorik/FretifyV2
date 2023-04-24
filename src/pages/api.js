// utils/api.js
const client_id = '6df6b59cb94b4bfbb76803a2092a11ee';
const client_secret = 'd4e56a8f3ba0415788089db89d49b931';

async function getAccessToken() {
  if (accessToken && Date.now() < accessTokenExpiration) {
    // Token is still valid, return it
    return accessToken;
  }

  // Token has expired or is not set, refresh it
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();

  accessToken = data.access_token;
  accessTokenExpiration = Date.now() + data.expires_in * 1000;

  return accessToken;
}