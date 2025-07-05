'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, needsAuth = false) => {
    setLoading(true);
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (needsAuth) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(endpoint, { headers });
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          ok: response.ok,
          data: data
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 'ERROR',
          ok: false,
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }));
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'password'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setResults(prev => ({
        ...prev,
        '/api/auth/login': {
          status: response.status,
          ok: response.ok,
          data: data
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        '/api/auth/login': {
          status: 'ERROR',
          ok: false,
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Page</h1>
        
        <div className="grid gap-4 mb-6">
          <Button onClick={() => testEndpoint('/api/test')} disabled={loading}>
            Test Database Connection
          </Button>
          
          <Button onClick={testLogin} disabled={loading}>
            Test Login (admin@test.com)
          </Button>
          
          <Button onClick={() => testEndpoint('/api/users', true)} disabled={loading}>
            Test Users API (needs auth)
          </Button>
          
          <Button onClick={() => testEndpoint('/api/teachers', true)} disabled={loading}>
            Test Teachers API (needs auth)
          </Button>
          
          <Button onClick={() => testEndpoint('/api/courses', true)} disabled={loading}>
            Test Courses API (needs auth)
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(results).map(([endpoint, result]: [string, any]) => (
            <Card key={endpoint}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {endpoint} 
                  <span className={`ml-2 text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
                    ({result.status})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
