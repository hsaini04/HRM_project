import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { Card, EmptyState } from '../components/ui/index.js';

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="This page does not exist in the SkillBridge prototype."
        action={
          <Link to="/dashboard" className="text-sm font-medium text-brand-700 hover:underline">
            Back to the dashboard
          </Link>
        }
      />
    </Card>
  );
}
