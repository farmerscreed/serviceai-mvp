'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, DollarSign, Clock } from 'lucide-react';

interface VenueDetailsStepProps {
  initialData?: {
    capacity: number;
    pricing: string;
    hours: string;
    amenities: string[];
    description: string;
  };
  onNext: (data: {
    capacity: number;
    pricing: string;
    hours: string;
    amenities: string[];
    description: string;
  }) => void;
  onBack: () => void;
}

const AMENITY_OPTIONS = [
  'Catering Kitchen',
  'Bar Area',
  'Audio/Visual Equipment',
  'WiFi',
  'Parking',
  'Outdoor Space',
  'Bridal Suite',
  'Dance Floor',
  'Stage',
  'Tables & Chairs',
];

export default function VenueDetailsStep({ initialData, onNext, onBack }: VenueDetailsStepProps) {
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() || '');
  const [pricing, setPricing] = useState(initialData?.pricing || '');
  const [hours, setHours] = useState(initialData?.hours || '');
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || []);
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState('');

  const handleAmenityToggle = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const capacityNum = parseInt(capacity);
    if (!capacity || isNaN(capacityNum) || capacityNum < 1) {
      setError('Please enter a valid capacity');
      return;
    }

    if (!pricing.trim()) {
      setError('Please enter your pricing information');
      return;
    }

    if (!hours.trim()) {
      setError('Please enter your operating hours');
      return;
    }

    if (amenities.length === 0) {
      setError('Please select at least one amenity');
      return;
    }

    onNext({
      capacity: capacityNum,
      pricing,
      hours,
      amenities,
      description,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Venue Details</h2>
        <p className="text-gray-600 mt-2">
          Help your AI assistant provide accurate information to callers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Capacity */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-700" />
            <Label htmlFor="capacity">Maximum Capacity *</Label>
          </div>
          <Input
            id="capacity"
            type="number"
            placeholder="300"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min="1"
          />
          <p className="text-sm text-gray-500 mt-1">Maximum number of guests</p>
        </div>

        {/* Pricing */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-700" />
            <Label htmlFor="pricing">Pricing Information *</Label>
          </div>
          <Textarea
            id="pricing"
            placeholder="Example: $1,500 Mon-Thu, $2,500 Fri/Sun, $3,000 Sat"
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            Your AI will use this to provide pricing quotes
          </p>
        </div>

        {/* Hours */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-700" />
            <Label htmlFor="hours">Operating Hours *</Label>
          </div>
          <Textarea
            id="hours"
            placeholder="Example: Mon-Fri 9am-5pm for tours, Events by appointment"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            rows={2}
          />
          <p className="text-sm text-gray-500 mt-1">
            When can customers tour or book your venue?
          </p>
        </div>

        {/* Amenities */}
        <div>
          <Label className="text-base mb-3 block">Amenities & Features *</Label>
          <div className="grid grid-cols-2 gap-3">
            {AMENITY_OPTIONS.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity}
                  checked={amenities.includes(amenity)}
                  onCheckedChange={() => handleAmenityToggle(amenity)}
                />
                <label
                  htmlFor={amenity}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {amenity}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Additional Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Any other details you'd like your AI assistant to know about your venue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-2"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
