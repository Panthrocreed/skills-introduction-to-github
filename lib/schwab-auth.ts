// Schwab OAuth2 utilities

export const getSchwabAuthUrl = () => {
  const clientId = process.env.SCHWAB_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SCHWAB_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Missing Schwab OAuth credentials');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read write',
  });

  return `https://api.schwabapi.com/v1/oauth/authorize?${params.toString()}`;
};

export interface SchwabTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const exchangeCodeForToken = async (
  code: string
): Promise<SchwabTokenResponse> => {
  const clientId = process.env.SCHWAB_CLIENT_ID;
  const clientSecret = process.env.SCHWAB_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_SCHWAB_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Schwab OAuth credentials');
  }

  const response = await fetch('https://api.schwabapi.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Schwab token exchange failed: ${response.statusText}`);
  }

  return response.json();
};

export interface SchwabAccount {
  accountNumber: string;
  accountType: string;
  accountStatus: string;
}

export interface SchwabAccountBalance {
  accountNumber: string;
  accountBalance: number;
  buyingPower: number;
  cashAvailable: number;
}

export const getAccounts = async (accessToken: string): Promise<SchwabAccount[]> => {
  const response = await fetch('https://api.schwabapi.com/v1/accounts', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounts: ${response.statusText}`);
  }

  const data = await response.json();
  return data.accounts || [];
};

export const getAccountBalance = async (
  accessToken: string,
  accountHash: string
): Promise<SchwabAccountBalance> => {
  const response = await fetch(
    `https://api.schwabapi.com/v1/accounts/${accountHash}/balances`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch account balance: ${response.statusText}`);
  }

  return response.json();
};
