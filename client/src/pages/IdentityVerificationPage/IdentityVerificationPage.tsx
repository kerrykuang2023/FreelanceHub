import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import httpService from '@/core/http.service';

type VerificationType = 'individual' | 'business';
type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface VerificationData {
  type: VerificationType;
  realName: string;
  idNumber: string;
  idFrontImage?: File;
  idBackImage?: File;
  companyName?: string;
  businessLicenseNumber?: string;
  businessLicenseImage?: File;
  address?: string;
  phone?: string;
}

const IdentityVerificationPage = () => {
  const navigate = useNavigate();
  const [verificationType, setVerificationType] = useState<VerificationType>('individual');
  const [status, setStatus] = useState<VerificationStatus>('none');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<VerificationData>({
    type: 'individual',
    realName: '',
    idNumber: '',
    address: '',
    phone: '',
  });

  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idFront' | 'idBack' | 'license') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'idFront') {
        setIdFrontPreview(base64);
        setFormData((prev) => ({ ...prev, idFrontImage: file }));
      } else if (type === 'idBack') {
        setIdBackPreview(base64);
        setFormData((prev) => ({ ...prev, idBackImage: file }));
      } else {
        setLicensePreview(base64);
        setFormData((prev) => ({ ...prev, businessLicenseImage: file }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.realName.trim()) {
      setError('Please enter your real name');
      return;
    }

    if (!formData.idNumber.trim()) {
      setError('Please enter your ID number');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        type: verificationType,
        realName: formData.realName,
        idNumber: formData.idNumber,
        address: formData.address,
        phone: formData.phone,
      };

      if (verificationType === 'business') {
        if (!formData.companyName || !formData.businessLicenseNumber) {
          setError('Please fill in all business information');
          return;
        }
        payload.companyName = formData.companyName;
        payload.businessLicenseNumber = formData.businessLicenseNumber;
      }

      await httpService.post('/auth/verify-identity', payload);
      setSuccess(true);
      setStatus('pending');
    } catch (err: any) {
      console.error('Failed to submit verification:', err);
      setError(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your identity verification has been submitted successfully. We will review your documents within 1-3 business days.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <ShieldCheckIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
                <p className="text-gray-600">Verify your identity to unlock all platform features</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Verification Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setVerificationType('individual')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    verificationType === 'individual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <IdentificationIcon className={`w-8 h-8 mx-auto mb-2 ${
                    verificationType === 'individual' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className={`font-medium ${
                    verificationType === 'individual' ? 'text-blue-600' : 'text-gray-700'
                  }`}>Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationType('business')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    verificationType === 'business'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BuildingOfficeIcon className={`w-8 h-8 mx-auto mb-2 ${
                    verificationType === 'business' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className={`font-medium ${
                    verificationType === 'business' ? 'text-blue-600' : 'text-gray-700'
                  }`}>Business</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Real Name *
                  </label>
                  <input
                    type="text"
                    name="realName"
                    value={formData.realName}
                    onChange={handleChange}
                    placeholder="Enter your legal name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="Enter your ID number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {verificationType === 'business' && (
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Enter company name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business License Number *
                      </label>
                      <input
                        type="text"
                        name="businessLicenseNumber"
                        value={formData.businessLicenseNumber}
                        onChange={handleChange}
                        placeholder="Enter license number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business License Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      {licensePreview ? (
                        <div className="relative">
                          <img src={licensePreview} alt="License" className="max-h-40 mx-auto rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setLicensePreview(null)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Upload Business License</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'license')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ID Card Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Front Side</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors h-32 flex items-center justify-center">
                      {idFrontPreview ? (
                        <img src={idFrontPreview} alt="ID Front" className="max-h-full rounded" />
                      ) : (
                        <label className="cursor-pointer">
                          <DocumentTextIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Upload Front</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'idFront')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Back Side</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors h-32 flex items-center justify-center">
                      {idBackPreview ? (
                        <img src={idBackPreview} alt="ID Back" className="max-h-full rounded" />
                      ) : (
                        <label className="cursor-pointer">
                          <DocumentTextIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Upload Back</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'idBack')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerificationPage;
