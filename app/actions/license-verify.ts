'use server';

import { keygenApi } from '@/lib/api';

interface KeygenResource {
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string } }>;
}

export interface LicenseVerificationResult {
  licenseId: string;
  key: string;
  status: string;
  expiry: string | null;
  machinesCount: number;
  ownerEmail: string | null;
  policyName: string | null;
  policyMaxMachines: number | null;
  policyDuration: number | null;
  policyStrict: boolean;
  policyFloating: boolean;
  productName: string | null;
  licenseName: string | null;
  p3AccountsAdded: number | null;
}

export async function verifyLicense(
  licenseId: string
): Promise<{ success: true; data: LicenseVerificationResult } | { success: false; error: string }> {
  if (!licenseId || licenseId.trim().length === 0) {
    return { success: false, error: 'Debe ingresar el ID de la licencia.' };
  }

  const trimmedId = licenseId.trim();

  try {
    const [licRes, polRes, usrRes, prodRes] = await Promise.all([
      keygenApi.get(`/licenses/${trimmedId}`),
      keygenApi.get('/policies'),
      keygenApi.get('/users'),
      keygenApi.get('/products'),
    ]);

    const license = licRes.data.data as KeygenResource;
    const policies = polRes.data.data as KeygenResource[];
    const users = usrRes.data.data as KeygenResource[];
    const products = prodRes.data.data as KeygenResource[];

    const policyId = license.relationships?.policy?.data?.id;
    const userId = license.relationships?.user?.data?.id;

    const policy = policyId ? policies.find((p) => p.id === policyId) : null;
    const user = userId ? users.find((u) => u.id === userId) : null;
    const product = policy ? products.find((prod) => prod.id === policy.relationships?.product?.data?.id) : null;

     const result: LicenseVerificationResult = {
      licenseId: license.id,
      key: license.attributes.key as string,
      status: (license.attributes.status as string) || 'ACTIVE',
      expiry: (license.attributes.expiry as string) || null,
      machinesCount: (license.attributes.machinesCount as number) ?? 0,
      ownerEmail: user?.attributes?.email as string | null,
      policyName: policy?.attributes?.name as string | null,
      policyMaxMachines: policy?.attributes?.maxMachines as number | null,
      policyDuration: policy?.attributes?.duration as number | null,
      policyStrict: (policy?.attributes?.strict as boolean) ?? false,
      policyFloating: (policy?.attributes?.floating as boolean) ?? false,
      productName: product?.attributes?.name as string | null,
      licenseName: (license.attributes.name as string) || null,
      p3AccountsAdded: (policy?.attributes?.metadata as Record<string, unknown> | undefined)?.MaxP3Accounts as number | null,
    };

    return { success: true, data: result };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return { success: false, error: 'No se encontró ninguna licencia con ese ID.' };
      }
    }
    return { success: false, error: 'Error al consultar la licencia. Verifique el ID e inténtelo nuevamente.' };
  }
}
