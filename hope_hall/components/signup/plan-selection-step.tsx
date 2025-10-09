'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanSelectionStepProps {
  initialData?: {
    selectedPlan: 'starter' | 'professional' | 'agency' | null;
  };
  onNext: (data: { selectedPlan: 'starter' | 'professional' | 'agency' }) => void;
  onBack: () => void;
}

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    monthlyPrice: 99,
    annualPrice: 950,
    includedMinutes: 500,
    overageRate: 0.12,
    maxPhoneNumbers: 1,
    features: [
      '500 call minutes/month',
      '1 phone number',
      'AI tour scheduling',
      'Lead qualification',
      'Basic analytics',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'professional' as const,
    name: 'Professional',
    monthlyPrice: 199,
    annualPrice: 1910,
    includedMinutes: 1500,
    overageRate: 0.11,
    maxPhoneNumbers: 3,
    features: [
      '1,500 call minutes/month',
      '3 phone numbers',
      'AI tour scheduling',
      'Advanced lead qualification',
      'Real-time analytics',
      'Custom AI prompts',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'agency' as const,
    name: 'Agency',
    monthlyPrice: 499,
    annualPrice: 4790,
    includedMinutes: 5000,
    overageRate: 0.1,
    maxPhoneNumbers: 10,
    features: [
      '5,000 call minutes/month',
      '10 phone numbers',
      'Multi-venue management',
      'White-label branding',
      'Advanced analytics',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
    ],
    popular: false,
  },
];

export default function PlanSelectionStep({
  initialData,
  onNext,
  onBack,
}: PlanSelectionStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'agency' | null>(
    initialData?.selectedPlan || null
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    onNext({ selectedPlan });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">Select the plan that best fits your venue's needs</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            billingCycle === 'monthly'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('annual')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            billingCycle === 'annual'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Annual
          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
            Save 20%
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {PLANS.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const isSelected = selectedPlan === plan.id;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  'relative p-6 rounded-xl border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-gray-200 hover:border-primary/50 hover:shadow-md'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {isSelected && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-primary text-white rounded-full p-1">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${price}</span>
                    <span className="text-gray-600">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-gray-500 mt-1">
                      ${(plan.annualPrice / 12).toFixed(0)}/month billed annually
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Overage: ${plan.overageRate.toFixed(2)}/minute
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>14-day free trial</strong> • No credit card required • Cancel anytime
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={!selectedPlan}>
            Continue to Setup
          </Button>
        </div>
      </form>
    </div>
  );
}
