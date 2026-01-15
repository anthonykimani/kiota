'use client'

import React, { useState, useEffect } from 'react';
import { usePrivy, useIdentityToken, getIdentityToken } from '@privy-io/react-auth';

function PrivyTokenTester() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken
  } = usePrivy();

  const [idToken, setIdToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncResponse, setSyncResponse] = useState(null);
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const { identityToken } = useIdentityToken();

  useEffect(() => {
    if (authenticated && ready) {
      loadTokens();
    }
  }, [authenticated, ready]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const id = await getIdentityToken();
      const access = await getAccessToken();
      setIdToken(identityToken || '');
      setAccessToken(access || '');
    } catch (error) {
      console.error('Error getting tokens:', error);
      alert('Error getting tokens: ' + error);
    }
    setLoading(false);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`✅ ${label} copied to clipboard!`);
    }).catch(err => {
      alert('❌ Failed to copy: ' + err);
    });
  };

  const testSyncEndpoint = async () => {
    if (!idToken) {
      alert('No identity token available. Login first.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/privy/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      setSyncResponse(data);
      
      if (response.ok) {
        alert('✅ Sync successful! Check response below.');
      } else {
        alert('❌ Sync failed. Check response below.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ Sync failed: ' + error);
      setSyncResponse({ error });
    }
    setLoading(false);
  };

  const testVerifyEndpoint = async () => {
    if (!accessToken) {
      alert('No access token available. Login first.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/privy/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      setSyncResponse(data);
      
      if (response.ok) {
        alert('✅ Verify successful! Check response below.');
      } else {
        alert('❌ Verify failed. Check response below.');
      }
    } catch (error) {
      console.error('Verify error:', error);
      alert('❌ Verify failed: ' + error);
      setSyncResponse(error);
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading Privy...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container">
        <div className="header">
          <h1>🔐 Privy Token Tester</h1>
          <p className="subtitle">Get authentication tokens for Kiota API testing</p>
        </div>

        <div className="info-box">
          <h3>📋 How to Use</h3>
          <ol>
            <li>Click "Login with Privy" below</li>
            <li>Authenticate with phone, email, or wallet</li>
            <li>Copy tokens to Postman environment variables</li>
            <li>Test API endpoints directly from this page</li>
          </ol>
        </div>

        <div className="api-config">
          <label htmlFor="apiUrl">API Base URL:</label>
          <input
            id="apiUrl"
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3000"
          />
        </div>

        <button className="btn btn-primary" onClick={login}>
          🔐 Login with Privy
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 Privy Token Tester</h1>
        <p className="subtitle">Authenticated as {user?.phone?.number || user?.email?.address || user?.wallet?.address}</p>
      </div>

      {/* User Info */}
      <div className="card">
        <h3>👤 User Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Privy User ID:</strong>
            <span className="mono">{user?.id}</span>
            <button
              className="btn btn-sm btn-copy"
              onClick={() => copyToClipboard(user?.id || '', 'User ID')}
            >
              📋 Copy
            </button>
          </div>

          {user?.phone && (
            <div className="info-item">
              <strong>Phone:</strong>
              <span>{user.phone.number}</span>
            </div>
          )}

          {user?.email && (
            <div className="info-item">
              <strong>Email:</strong>
              <span>{user.email.address}</span>
            </div>
          )}

          {user?.wallet && (
            <div className="info-item">
              <strong>Wallet Address:</strong>
              <span className="mono">{user.wallet.address}</span>
              <button
                className="btn btn-sm btn-copy"
                onClick={() => copyToClipboard(user.wallet?.address, 'Wallet Address')}
              >
                📋 Copy
              </button>
            </div>
          )}
        </div>

        <div className="button-group">
          <button
            className="btn btn-secondary"
            onClick={loadTokens}
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh Tokens'}
          </button>
          <button className="btn btn-danger" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Identity Token */}
      {idToken && (
        <div className="card">
          <h3>🎫 Identity Token</h3>
          <p className="card-description">
            Use this token for <code>POST /auth/privy/sync</code>
          </p>
          <div className="token-box">
            <code className="token-text">{idToken}</code>
          </div>
          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(idToken, 'Identity Token')}
            >
              📋 Copy Full Token
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const env = `privy_id_token=${idToken}`;
                copyToClipboard(env, 'Postman Environment Variable');
              }}
            >
              📋 Copy for Postman
            </button>
          </div>
        </div>
      )}

      {/* Access Token */}
      {accessToken && (
        <div className="card">
          <h3>🔑 Access Token</h3>
          <p className="card-description">
            Use this token for <code>POST /auth/privy/verify</code>
          </p>
          <div className="token-box">
            <code className="token-text">{accessToken}</code>
          </div>
          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(accessToken, 'Access Token')}
            >
              📋 Copy Full Token
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const env = `privy_access_token=${accessToken}`;
                copyToClipboard(env, 'Postman Environment Variable');
              }}
            >
              📋 Copy for Postman
            </button>
          </div>
        </div>
      )}

      {/* API Testing */}
      <div className="card">
        <h3>🧪 Test API Endpoints</h3>
        
        <div className="api-config">
          <label htmlFor="apiUrl">API Base URL:</label>
          <input
            id="apiUrl"
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3000"
          />
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={testSyncEndpoint}
            disabled={loading || !idToken}
          >
            🚀 Test POST /auth/privy/sync
          </button>
          <button
            className="btn btn-primary"
            onClick={testVerifyEndpoint}
            disabled={loading || !accessToken}
          >
            ✅ Test POST /auth/privy/verify
          </button>
        </div>

        {syncResponse && (
          <div className="response-box">
            <div className="response-header">
              <strong>API Response:</strong>
              <button
                className="btn btn-sm btn-copy"
                onClick={() => copyToClipboard(JSON.stringify(syncResponse, null, 2), 'Response')}
              >
                📋 Copy
              </button>
            </div>
            <pre className="response-content">
              {JSON.stringify(syncResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Postman Instructions */}
      <div className="card info-card">
        <h3>📝 Postman Setup Instructions</h3>
        <ol>
          <li>
            <strong>Create Environment:</strong> In Postman, create a new environment called "Kiota Dev"
          </li>
          <li>
            <strong>Add Variables:</strong>
            <ul>
              <li><code>base_url</code> = {apiUrl}</li>
              <li><code>privy_id_token</code> = [Copy from Identity Token above]</li>
              <li><code>privy_access_token</code> = [Copy from Access Token above]</li>
            </ul>
          </li>
          <li>
            <strong>Use in Requests:</strong>
            <ul>
              <li>Body: <code>{`{"idToken": "{{privy_id_token}}"}`}</code></li>
              <li>Header: <code>{`Authorization: Bearer {{privy_access_token}}`}</code></li>
            </ul>
          </li>
          <li>
            <strong>Save Response Data:</strong> After calling /sync, save:
            <ul>
              <li><code>user_id</code> from response</li>
              <li><code>jwt_token</code> from response</li>
              <li><code>wallet_address</code> from response</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default PrivyTokenTester;