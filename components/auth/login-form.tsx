'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onSuccess: (user: any, token: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      onSuccess(data.user, data.token);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter your email"
          className="h-9"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="text-sm">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          className="h-9"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full h-9"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Demo accounts */}
      <div className="mt-4 p-3 bg-muted rounded-lg">
        <p className="text-xs font-medium mb-2 text-center text-muted-foreground">Demo Accounts</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center p-1.5 bg-background rounded border">
            <span className="font-medium">Admin:</span>
            <span className="font-mono text-muted-foreground">admin@test.com / password</span>
          </div>
          <div className="flex justify-between items-center p-1.5 bg-background rounded border">
            <span className="font-medium">Teacher:</span>
            <span className="font-mono text-muted-foreground">teacher@test.com / password</span>
          </div>
          <div className="flex justify-between items-center p-1.5 bg-background rounded border">
            <span className="font-medium">Student:</span>
            <span className="font-mono text-muted-foreground">student@test.com / password</span>
          </div>
        </div>
      </div>
    </form>
  );
}