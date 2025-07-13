'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function CreateSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Schedule creation functionality will be available soon.</p>
            <div className="mt-4">
              <Button onClick={() => router.push('/schedules')}>
                Back to Schedules
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
