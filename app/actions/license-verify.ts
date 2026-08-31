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
    const licRes = await keygenApi.get(`/licenses/${trimmedId}`);
    const license = licRes.data.data as KeygenResource;

    const policyId = license.relationships?.policy?.data?.id;
    const userId = license.relationships?.user?.data?.id;
    const productId = license.relationships?.product?.data?.id;

    let policy: KeygenResource | null = null;
    let user: KeygenResource | null = null;
    let product: KeygenResource | null = null;
    let p3AccountsAdded: number | null = null;

    if (policyId) {
      const polRes = await keygenApi.get(`/policies/${policyId}`);
      policy = polRes.data.data as KeygenResource;

      const metadata = policy.attributes.metadata as Record<string, unknown> | undefined;
      p3AccountsAdded = metadata?.maxP3Accounts as number | null;

      const productIdFromPolicy = policy.relationships?.product?.data?.id;
      if (productIdFromPolicy) {
        const prodRes = await keygenApi.get(`/products/${productIdFromPolicy}`);
        product = prodRes.data.data as KeygenResource;
      }
    }

    if (productId && !product) {
      const prodRes = await keygenApi.get(`/products/${productId}`);
      product = prodRes.data.data as KeygenResource;
    }

    if (userId) {
      const usrRes = await keygenApi.get(`/users/${userId}`);
      user = usrRes.data.data as KeygenResource;
    }

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
      p3AccountsAdded,
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
