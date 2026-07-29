import { keygenApi, formatJsonApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { Trash2 } from 'lucide-react';
import CopyButton from './components/CopyButton';

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
    } catch (e) { 
      console.error("Delete Error", e); 
    }
  }

  // Diccionario de títulos limpio y con emojis estándar
  const titles: Record<string, string> = { 
    products: '📦 Productos', 
    policies: '📜 Políticas', 
    users: '👥 Usuarios', 
    licenses: '🔑 Licencias' 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-gray-900">
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800 shadow-lg">
        <div className="p-6 text-xl font-bold tracking-wider border-b border-gray-800">
          KEYGEN<span className="text-blue-400">UI</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {Object.entries(titles).map(([key, label]) => (
            <a 
              key={key} 
              href={`?view=${key}`} 
              className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                currentView === key ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {errorMessage && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm">
              <p className="font-bold">Error</p>
              <p>{errorMessage}</p>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">{titles[currentView]}</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-700">Nombre / ID / Clave</th>
                    <th className="p-4 font-semibold text-gray-700 w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  
                  {/* Vista de PRODUCTOS */}
                  {currentView === 'products' && products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{p.attributes.name}</span> <br/>
                        <span className="text-xs text-gray-500 font-mono">{p.id}</span>
                      </td>
                      <td className="p-4">
                        <form action={deleteResource}>
                          <input type="hidden" name="type" value="product"/>
                          <input type="hidden" name="id" value={p.id}/>
                          <button className="text-red-600 hover:text-red-800 p-1"><Trash2 size={18}/></button>
                        </form>
                      </td>
                    </tr>
                  ))}

                  {/* Vista de POLÍTICAS (Faltaba en tu código) */}
                  {currentView === 'policies' && policies.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{p.attributes.name}</span> <br/>
                        <span className="text-xs text-gray-500 font-mono">{p.id}</span>
                      </td>
                      <td className="p-4">
                        <form action={deleteResource}>
                          <input type="hidden" name="type" value="policy"/>
                          <input type="hidden" name="id" value={p.id}/>
                          <button className="text-red-600 hover:text-red-800 p-1"><Trash2 size={18}/></button>
                        </form>
                      </td>
                    </tr>
                  ))}

                  {/* Vista de USUARIOS (Faltaba en tu código) */}
                  {currentView === 'users' && users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{u.attributes.email}</span> <br/>
                        <span className="text-xs text-gray-500 font-mono">{u.id}</span>
                      </td>
                      <td className="p-4">
                        <form action={deleteResource}>
                          <input type="hidden" name="type" value="user"/>
                          <input type="hidden" name="id" value={u.id}/>
                          <button className="text-red-600 hover:text-red-800 p-1"><Trash2 size={18}/></button>
                        </form>
                      </td>
                    </tr>
                  ))}

                  {/* Vista de LICENCIAS */}
                  {currentView === 'licenses' && licenses.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                          {l.attributes.key}
                        </span> <br/>
                        <span className="text-xs text-gray-500 font-mono mt-2 inline-block">{l.id}</span>
                      </td>
                      <td className="p-4 flex gap-3 items-center mt-2">
                         <CopyButton textToCopy={l.attributes.key} />
                         <form action={deleteResource}>
                           <input type="hidden" name="type" value="license"/>
                           <input type="hidden" name="id" value={l.id}/>
                           <button className="text-red-600 hover:text-red-800 p-1"><Trash2 size={18}/></button>
                         </form>
                      </td>
                    </tr>
                  ))}

                  {/* Mensaje si la tabla está vacía */}
                  {((currentView === 'products' && products.length === 0) || 
                    (currentView === 'policies' && policies.length === 0) || 
                    (currentView === 'users' && users.length === 0) || 
                    (currentView === 'licenses' && licenses.length === 0)) && (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-500 italic">
                        No hay registros para mostrar en esta vista.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}