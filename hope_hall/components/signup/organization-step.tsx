'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Phone, MapPin } from 'lucide-react';

interface OrganizationStepProps {
  initialData?: {
    venueName: string;
    venueType: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    forwardingPhone: string;
  };
  onNext: (data: {
    venueName: string;
    venueType: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    forwardingPhone: string;
  }) => void;
  onBack: () => void;
}

const VENUE_TYPES = [
  'Event Hall',
  'Banquet Hall',
  'Conference Center',
  'Wedding Venue',
  'Community Center',
  'Hotel/Resort',
  'Restaurant',
  'Other',
];

export default function OrganizationStep({ initialData, onNext, onBack }: OrganizationStepProps) {
  const [venueName, setVenueName] = useState(initialData?.venueName || '');
  const [venueType, setVenueType] = useState(initialData?.venueType || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '');
  const [forwardingPhone, setForwardingPhone] = useState(initialData?.forwardingPhone || '');
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setForwardingPhone(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!venueName.trim()) {
      setError('Venue name is required');
      return;
    }

    if (!venueType) {
      setError('Please select a venue type');
      return;
    }

    if (!address.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      setError('Complete address is required');
      return;
    }

    if (zipCode.replace(/\D/g, '').length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    if (forwardingPhone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    onNext({
      venueName,
      venueType,
      address,
      city,
      state,
      zipCode,
      forwardingPhone,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Venue Information</h2>
        <p className="text-gray-600 mt-2">
          Tell us about your venue so we can customize your AI assistant
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Venue Name */}
        <div>
          <Label htmlFor="venueName">Venue Name *</Label>
          <Input
            id="venueName"
            type="text"
            placeholder="Hope Hall Event Center"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Venue Type */}
        <div>
          <Label htmlFor="venueType">Venue Type *</Label>
          <Select value={venueType} onValueChange={setVenueType}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select venue type" />
            </SelectTrigger>
            <SelectContent>
              {VENUE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4" />
            <span>Venue Address</span>
          </div>

          <div>
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                type="text"
                placeholder="NY"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              type="text"
              placeholder="10001"
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Forwarding Phone */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-gray-700" />
            <Label htmlFor="forwardingPhone">Forwarding Phone Number *</Label>
          </div>
          <Input
            id="forwardingPhone"
            type="tel"
            placeholder="555-123-4567"
            value={forwardingPhone}
            onChange={handlePhoneChange}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Calls will be forwarded to this number if AI can't handle them
          </p>
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
