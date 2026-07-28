import { keygenApi, formatJsonApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { Trash2, Copy, Edit2 } from 'lucide-react'; // Instala lucide-react para los iconos

interface KeygenProduct {
  id: string;
  attributes: { name: string; created: string; };
}

interface KeygenPolicy {
  id: string;
  attributes: { name: string; maxMachines: number | null; strict: boolean; created: string; };
}

interface KeygenUser {
  id: string;
  attributes: { firstName: string | null; lastName: string | null; email: string; created: string; };
}

interface KeygenLicense {
  id: string;
  attributes: { key: string; status: string; expiry: string | null; created: string; };
  relationships: {
    policy: { data: { id: string } };
    user: { data: { id: string } };
  };
}

type Props = { searchParams?: Promise<{ view?: string }> };

export default async function Dashboard(props: Props) {
  const searchParams = await props.searchParams;
  const currentView = searchParams?.view || 'products';

  let products: KeygenProduct[] = [];
  let policies: KeygenPolicy[] = [];
  let users: KeygenUser[] = [];
  let licenses: KeygenLicense[] = [];
  let errorMessage = '';

  try {
    if (currentView === 'products') {
      const res = await keygenApi.get('/products');
      products = res.data.data;
    } else if (currentView === 'policies') {
      const [polRes, prodRes] = await Promise.all([keygenApi.get('/policies'), keygenApi.get('/products')]);
      policies = polRes.data.data;
      products = prodRes.data.data;
    } else if (currentView === 'users') {
      const res = await keygenApi.get('/users');
      users = res.data.data;
    } else if (currentView === 'licenses') {
      const [licRes, polRes, usrRes] = await Promise.all([
        keygenApi.get('/licenses'), keygenApi.get('/policies'), keygenApi.get('/users')
      ]);
      licenses = licRes.data.data;
      policies = polRes.data.data;
      users = usrRes.data.data;
    }
  } catch (error) {
    console.error(`Error loading ${currentView}:`, error);
    errorMessage = `Error de conexión: ${error instanceof Error ? error.message : 'Verifica tokens.'}`;
  }

  async function deleteResource(formData: FormData) {
    'use server';
    const type = formData.get('type') as string;
    const id = formData.get('id') as string;
    if (!type || !id) return;
    try {
      await keygenApi.delete(`/${type}s/${id}`);
      revalidatePath('/?view=' + (type === 'policy' ? 'policies' : type + 's'));
    } catch (e) { console.error("Delete Error", e); }
  }

  async function createProduct(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    if (!name) return;
    await keygenApi.post('/products', formatJsonApi('product', { name: name.trim() }));
    revalidatePath('/?view=products');
  }

  async function createPolicy(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const maxMachines = parseInt(formData.get('maxMachines') as string) || 1;
    const productId = formData.get('productId') as string;
    await keygenApi.post('/policies', formatJsonApi('policy', { name: name.trim(), maxMachines, strict: true }, { product: { type: 'product', id: productId } }));
    revalidatePath('/?view=policies');
  }

  async function createUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    await keygenApi.post('/users', formatJsonApi('user', { email: email.trim() }));
    revalidatePath('/?view=users');
  }

  async function createLicense(formData: FormData) {
    'use server';
    const policyId = formData.get('policyId') as string;
    const userId = formData.get('userId') as string;
    await keygenApi.post('/licenses', formatJsonApi('license', {}, { policy: { type: 'policy', id: policyId }, user: { type: 'user', id: userId } }));
    revalidatePath('/?view=licenses');
  }

  const titles: Record<string, string> = { products: '📦 Productos', policies: '📜 Políticas', users: '👥 Usuarios', licenses: '🔑 Licencias' };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800">
        <div className="p-6 text-xl font-bold tracking-wider">KEYGEN<span className="text-blue-400">UI</span></div>
        <nav className="flex-1 p-4 space-y-1">
          {Object.entries(titles).map(([key, label]) => (
            <a key={key} href={`?view=${key}`} className={`block px-4 py-3 rounded-lg ${currentView === key ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {errorMessage && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{errorMessage}</div>}
          
          {/* Listado con Acciones */}
          <div className="bg-white rounded-xl shadow border p-6">
            <h2 className="text-2xl font-bold mb-6">{titles[currentView]}</h2>
            
            <table className="w-full text-left">
              <thead className="border-b"><tr><th className="p-4">Nombre / ID</th><th className="p-4">Acciones</th></tr></thead>
              <tbody className="divide-y">
                {currentView === 'products' && products.map(p => (
                  <tr key={p.id}>
                    <td className="p-4">{p.attributes.name} <span className="text-xs text-gray-400">({p.id})</span></td>
                    <td className="p-4 flex gap-2">
                      <form action={deleteResource}><input type="hidden" name="type" value="product"/><input type="hidden" name="id" value={p.id}/><button className="text-red-600"><Trash2 size={18}/></button></form>
                    </td>
                  </tr>
                ))}
                {currentView === 'licenses' && licenses.map(l => (
                  <tr key={l.id}>
                    <td className="p-4 font-mono text-green-700">{l.attributes.key}</td>
                    <td className="p-4 flex gap-2">
                       <button onClick={() => navigator.clipboard.writeText(l.attributes.key)} className="text-blue-600"><Copy size={18}/></button>
                       <form action={deleteResource}><input type="hidden" name="type" value="license"/><input type="hidden" name="id" value={l.id}/><button className="text-red-600"><Trash2 size={18}/></button></form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}