'use client';

import { useState } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import LicenseResult from './LicenseResult';
import { verifyLicense, LicenseVerificationResult } from '@/app/actions/license-verify';

type VerifyState = 'idle' | 'loading' | 'success' | 'error';

export default function LicenseSearch() {
  const [licenseId, setLicenseId] = useState('');
  const [state, setState] = useState<VerifyState>('idle');
  const [result, setResult] = useState<LicenseVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseId.trim()) {
      setState('error');
      setError('Por favor, ingrese el ID de la licencia.');
      return;
    }

    setState('loading');
    setError(null);
    setResult(null);

    try {
      const res = await verifyLicense(licenseId);
      if (res.success) {
        setResult(res.data);
        setState('success');
      } else {
        setState('error');
        setError(res.error);
      }
    } catch {
      setState('error');
      setError('Error inesperado. Intente nuevamente.');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <input
          type="text"
          value={licenseId}
          onChange={(e) => setLicenseId(e.target.value)}
          placeholder="Ingrese el ID de la licencia (UUID)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 font-mono text-sm"
          disabled={state === 'loading'}
          minLength={36}
          maxLength={36}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
        >
          {state === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
          <Search className="w-5 h-5" />
          )}
          {state === 'loading' ? 'Verificando...' : 'Verificar'}
        </button>
      </form>

      {state === 'error' && error && (
        <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {state === 'success' && result && <LicenseResult data={result} />}
    </div>
  );
}
