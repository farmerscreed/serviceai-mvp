'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Phone, Mail, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompletionStepProps {
  data?: {
    email: string;
    venueName: string;
    phoneNumber?: string;
    selectedPlan: string;
  };
  // Stub props for compatibility with signup wizard
  initialData?: any;
  onNext?: any;
  onBack?: any;
}

export default function CompletionStep({ data }: CompletionStepProps) {
  if (!data) {
    return <div>Loading...</div>;
  }
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="bg-green-100 rounded-full p-6">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to VenueVoice.ai! 🎉
        </h2>
        <p className="text-lg text-gray-600">
          Your AI receptionist is ready to start capturing leads
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Your Setup is Complete</h3>

        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 flex items-start gap-3 text-left">
            <div className="bg-primary/10 rounded-lg p-2">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Your AI Phone Number</p>
              {data.phoneNumber ? (
                <p className="text-2xl font-bold text-primary mt-1">{data.phoneNumber}</p>
              ) : (
                <p className="text-gray-600 mt-1">Being provisioned...</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Share this number on your website, ads, and marketing materials
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex items-start gap-3 text-left">
            <div className="bg-primary/10 rounded-lg p-2">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Account Email</p>
              <p className="text-gray-700 mt-1">{data.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Your 14-Day Free Trial Starts Now</h4>
        <p className="text-sm text-gray-700">
          You have full access to all <strong>{data.selectedPlan}</strong> plan features.
          No credit card required until trial ends.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <h4 className="font-semibold text-gray-900">What happens next?</h4>
        <div className="grid md:grid-cols-3 gap-4 text-left">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Customize Your AI</h5>
            <p className="text-sm text-gray-600">
              Fine-tune your assistant's responses and behavior in Settings
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Test Your Setup</h5>
            <p className="text-sm text-gray-600">
              Call your number to test the AI and make adjustments
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Go Live</h5>
            <p className="text-sm text-gray-600">
              Start promoting your number and watch leads roll in
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button onClick={handleGoToDashboard} size="lg" className="gap-2">
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Need help getting started?{' '}
        <a href="/docs" className="text-primary hover:underline">
          Check our documentation
        </a>{' '}
        or{' '}
        <a href="mailto:support@venuevoice.ai" className="text-primary hover:underline">
          contact support
        </a>
      </p>
    </div>
  );
}
