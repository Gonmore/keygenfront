import {
  User,
  Package,
  Shield,
  Activity,
  HardDrive,
  Calendar,
  Clock,
  Tag,
} from 'lucide-react';
import { LicenseVerificationResult } from '@/app/actions/license-verify';

export default function LicenseResult({ data }: { data: LicenseVerificationResult }) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatExpiry = (iso: string | null) => {
    if (!iso) return 'Perpetua';
    return formatDate(iso);
  };

  const isExpired = data.expiry ? new Date(data.expiry) < new Date() : false;

  const getStatusColor = (status: string) => {
    if (isExpired) return 'bg-gray-100 text-gray-700 border-gray-200';
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const durationText = () => {
    if (!data.policyDuration) return 'Perpetua';
    const days = Math.round(data.policyDuration / 86400);
    return `${days} día${days !== 1 ? '(s)' : ''}`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Detalles de la Licencia
          </h2>
          <p className="text-sm text-gray-500 font-mono break-all">
            ID: {data.licenseId}
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              Nombre
            </span>
            <span className="text-gray-800 font-medium">
              {data.licenseName || 'Sin nombre'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Estado
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                data.status
              )}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  data.status === 'ACTIVE' && !isExpired
                    ? 'bg-emerald-500'
                    : 'bg-gray-400'
                }`}
              />
              {data.status}
              {isExpired && ' (Vencida)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Propietario
            </span>
            <span className="text-gray-800 font-medium">
              {data.ownerEmail || 'Sin asignar'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              Producto
            </span>
            <span className="text-gray-800 font-medium">
              {data.productName || 'Sin definir'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              Política
            </span>
            <span className="text-gray-800 font-medium">
              {data.policyName || 'Sin definir'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-400" />
              Cuentas P3 agregadas
            </span>
            <span className="text-gray-800 font-medium">
              {data.p3AccountsAdded != null ? data.p3AccountsAdded.toString() : 'Sin definir'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Duración de la política
            </span>
            <span className="text-gray-800 font-medium">{durationText()}</span>
          </div>

          {data.policyStrict && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                Modo estricto
              </span>
              <span className="text-gray-800 font-medium">Activado</span>
            </div>
          )}

          {data.policyFloating && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gray-400" />
                Licencia flotante
              </span>
              <span className="text-gray-800 font-medium">Activado</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Vencimiento
            </span>
            <span
              className={`font-medium ${
                isExpired ? 'text-red-600' : 'text-gray-800'
              }`}
            >
              {formatExpiry(data.expiry)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Clave de licencia
            </span>
            <span className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 break-all">
              {data.key}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          Verificar otra licencia
        </button>
      </div>
    </div>
  );
}
