// app/actions/products.ts
'use server';

import { keygenApi } from '@/lib/api';

export async function getProducts() {
  try {
    const response = await keygenApi.get('/products');
    // Keygen devuelve un objeto con la estructura { data: [...], meta: {...} }
    return response.data.data; 
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw new Error("No se pudieron cargar los productos");
  }
}