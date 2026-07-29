import { keygenApi, formatJsonApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Trash2, Plus, X, Edit2, Key, Shield, User as UserIcon, Package } from 'lucide-react';
import CopyButton from './components/CopyButton';

interface KeygenProduct {
  id: string;
  attributes: { name: string; url: string | null; created: string; };
}

interface KeygenPolicy {
  id: string;
  attributes: { name: string; maxMachines: number | null; duration: number | null; strict: boolean; floating: boolean; created: string; };
  relationships?: {
    product?: { data?: { id: string } };
  };
}

interface KeygenUser {
  id: string;
  attributes: { firstName: string | null; lastName: string | null; email: string; created: string; };
}

interface KeygenLicense {
  id: string;
  attributes: { key: string; status: string; expiry: string | null; machinesCount: number; created: string; };
  relationships?: {
    policy?: { data?: { id: string } };
    user?: { data?: { id: string } };
  };
}

type Props = { 
  searchParams?: Promise<{ view?: string; action?: string; id?: string }> 
};

export default async function Dashboard(props: Props) {
  const searchParams = await props.searchParams;
  const currentView = searchParams?.view || 'products';
  const actionParam = searchParams?.action;
  const targetId = searchParams?.id;

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
      const [polRes, prodRes] = await Promise.all([
        keygenApi.get('/policies'), 
        keygenApi.get('/products')
      ]);
      policies = polRes.data.data;
      products = prodRes.data.data;
    } else if (currentView === 'users') {
      const res = await keygenApi.get('/users');
      users = res.data.data;
    } else if (currentView === 'licenses') {
      const [licRes, polRes, usrRes, prodRes] = await Promise.all([
        keygenApi.get('/licenses'),
        keygenApi.get('/policies'),
        keygenApi.get('/users'),
        keygenApi.get('/products')
      ]);
      licenses = licRes.data.data;
      policies = polRes.data.data;
      users = usrRes.data.data;
      products = prodRes.data.data;
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

  async function createProduct(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    if (!name) return;
    try {
      await keygenApi.post('/products', formatJsonApi('product', { name: name.trim(), url: url.trim() || null }));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=products');
    redirect('/?view=products');
  }

  async function createPolicy(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const maxMachines = parseInt(formData.get('maxMachines') as string) || 1;
    const durationDays = formData.get('durationDays') as string;
    const duration = durationDays ? parseInt(durationDays) * 86400 : null;
    const strict = formData.get('strict') === 'on';
    const floating = formData.get('floating') === 'on';
    const productId = formData.get('productId') as string;
    try {
      await keygenApi.post('/policies', formatJsonApi('policy', { name: name.trim(), maxMachines, duration, strict, floating }, { product: { type: 'product', id: productId } }));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=policies');
    redirect('/?view=policies');
  }

  async function createUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    try {
      await keygenApi.post('/users', formatJsonApi('user', { email: email.trim() }));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=users');
    redirect('/?view=users');
  }

  async function createLicense(formData: FormData) {
    'use server';
    const policyId = formData.get('policyId') as string;
    const userId = formData.get('userId') as string;
    const expiry = formData.get('expiry') as string;
    
    const attrs: any = {};
    if (expiry) attrs.expiry = new Date(expiry).toISOString();

    try {
      await keygenApi.post('/licenses', formatJsonApi('license', attrs, { policy: { type: 'policy', id: policyId }, user: { type: 'user', id: userId } }));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=licenses');
    redirect('/?view=licenses');
  }

  async function updateProduct(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    if (!id || !name) return;
    try {
      await keygenApi.patch(`/products/${id}`, formatJsonApi('product', { name: name.trim(), url: url.trim() || null }));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=products');
    redirect('/?view=products');
  }

  async function updatePolicy(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const maxMachines = parseInt(formData.get('maxMachines') as string) || 1;
    const durationDays = formData.get('durationDays') as string;
    const duration = durationDays ? parseInt(durationDays) * 86400 : null;
    const strict = formData.get('strict') === 'on';
    const floating = formData.get('floating') === 'on';
    if (!id || !name) return;
    try {
      await keygenApi.patch(`/policies/${id}`, formatJsonApi('policy', { name: name.trim(), maxMachines, duration, strict, floating }));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=policies');
    redirect('/?view=policies');
  }

  async function updateUser(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const email = formData.get('email') as string;
    if (!id || !email) return;
    try {
      await keygenApi.patch(`/users/${id}`, formatJsonApi('user', { email: email.trim() }));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=users');
    redirect('/?view=users');
  }

  async function updateLicense(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const policyId = formData.get('policyId') as string;
    const userId = formData.get('userId') as string;
    const expiry = formData.get('expiry') as string;
    
    if (!id) return;
    try {
      const relationships: Record<string, any> = {};
      if (policyId) relationships.policy = { type: 'policy', id: policyId };
      if (userId) relationships.user = { type: 'user', id: userId };
      
      const attrs: any = {};
      if (expiry) attrs.expiry = new Date(expiry).toISOString();
      
      await keygenApi.patch(`/licenses/${id}`, formatJsonApi('license', attrs, relationships));
    } catch (e) { console.error(e); }
    revalidatePath('/?view=licenses');
    redirect('/?view=licenses');
  }

  const titles: Record<string, string> = { 
    products: '📦 Productos', 
    policies: '📜 Políticas', 
    users: '👥 Usuarios', 
    licenses: '🔑 Licencias' 
  };

  let editItem: any = null;
  if (actionParam === 'edit' && targetId) {
    if (currentView === 'products') editItem = products.find(p => p.id === targetId);
    if (currentView === 'policies') editItem = policies.find(p => p.id === targetId);
    if (currentView === 'users') editItem = users.find(u => u.id === targetId);
    if (currentView === 'licenses') editItem = licenses.find(l => l.id === targetId);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-gray-900">
      {}
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

      {}
      <main className="flex-1 p-8 relative">
        <div className="max-w-6xl mx-auto">
          {errorMessage && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm">
              <p className="font-bold">Error</p>
              <p>{errorMessage}</p>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            
            {/* CABECERA CON BOTÓN NUEVO */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">{titles[currentView]}</h2>
              <a 
                href={`?view=${currentView}&action=new`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={18} /> Nuevo
              </a>
            </div>
            
            {}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-700">
                      {currentView === 'licenses' ? 'Clave / ID' : 'Nombre / ID'}
                    </th>
                    {currentView === 'licenses' && (
                      <>
                        <th className="p-4 font-semibold text-gray-700">Política & Producto</th>
                        <th className="p-4 font-semibold text-gray-700">Usuario Asignado</th>
                        <th className="p-4 font-semibold text-gray-700">Estado</th>
                      </>
                    )}
                    <th className="p-4 font-semibold text-gray-700 w-36 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  
                  {/* Vista de PRODUCTOS */}
                  {currentView === 'products' && products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{p.attributes.name}</span> <br/>
                        <span className="text-xs text-gray-500 font-mono">{p.id}</span>
                        {p.attributes.url && (
                          <a href={p.attributes.url} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 hover:underline mt-1">
                            {p.attributes.url}
                          </a>
                        )}
                      </td>
                      <td className="p-4 flex gap-2 justify-end items-center">
                        <a 
                          href={`?view=products&action=edit&id=${p.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </a>
                        <form action={deleteResource}>
                          <input type="hidden" name="type" value="product"/>
                          <input type="hidden" name="id" value={p.id}/>
                          <button className="text-red-600 hover:text-red-800 p-1 transition-colors"><Trash2 size={18}/></button>
                        </form>
                      </td>
                    </tr>
                  ))}

                  {/* Vista de POLÍTICAS */}
                  {currentView === 'policies' && policies.map(p => {
                    const linkedProduct = products.find(prod => prod.id === p.relationships?.product?.data?.id);
                    const durationText = p.attributes.duration ? `${p.attributes.duration / 86400} días` : 'Perpetua';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <span className="font-medium text-gray-900">{p.attributes.name}</span>
                          {linkedProduct && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-300">
                              📦 {linkedProduct.attributes.name}
                            </span>
                          )}
                          <br/>
                          <span className="text-xs text-gray-500 font-mono">{p.id} • Máx. Máquinas: {p.attributes.maxMachines || '∞'} • {durationText}</span>
                          <div className="mt-1 flex gap-2">
                            {p.attributes.strict && <span className="text-[10px] uppercase font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Estricta</span>}
                            {p.attributes.floating && <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Flotante</span>}
                          </div>
                        </td>
                        <td className="p-4 flex gap-2 justify-end items-center">
                          <a 
                            href={`?view=policies&action=edit&id=${p.id}`}
                            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </a>
                          <form action={deleteResource}>
                            <input type="hidden" name="type" value="policy"/>
                            <input type="hidden" name="id" value={p.id}/>
                            <button className="text-red-600 hover:text-red-800 p-1 transition-colors"><Trash2 size={18}/></button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Vista de USUARIOS */}
                  {currentView === 'users' && users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{u.attributes.email}</span> <br/>
                        <span className="text-xs text-gray-500 font-mono">{u.id}</span>
                      </td>
                      <td className="p-4 flex gap-2 justify-end items-center">
                        <a 
                          href={`?view=users&action=edit&id=${u.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </a>
                        <form action={deleteResource}>
                          <input type="hidden" name="type" value="user"/>
                          <input type="hidden" name="id" value={u.id}/>
                          <button className="text-red-600 hover:text-red-800 p-1 transition-colors"><Trash2 size={18}/></button>
                        </form>
                      </td>
                    </tr>
                  ))}

                  {/* Vista de LICENCIAS (CON DETALLES DE POLÍTICA, PRODUCTO Y USUARIO) */}
                  {currentView === 'licenses' && licenses.map(l => {
                    const policyId = l.relationships?.policy?.data?.id;
                    const userId = l.relationships?.user?.data?.id;
                    
                    const policy = policies.find(p => p.id === policyId);
                    const user = users.find(u => u.id === userId);
                    const product = policy ? products.find(prod => prod.id === policy.relationships?.product?.data?.id) : null;

                    return (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-semibold text-green-800 bg-green-50 px-2.5 py-1 rounded border border-green-300 inline-block mb-1">
                            {l.attributes.key}
                          </span> <br/>
                          <span className="text-xs text-gray-500 font-mono">{l.id}</span>
                        </td>
                        <td className="p-4 text-sm">
                          {policy ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                                <Shield size={14} className="text-blue-600" /> {policy.attributes.name}
                              </span>
                              {product && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Package size={12} className="text-gray-400" /> {product.attributes.name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin Política</span>
                          )}
                        </td>
                        <td className="p-4 text-sm">
                          {user ? (
                            <span className="text-gray-700 flex items-center gap-1.5 font-medium">
                              <UserIcon size={14} className="text-purple-600" /> {user.attributes.email}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin Asignar</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                              l.attributes.status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {l.attributes.status || 'ACTIVE'}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              Uso: {l.attributes.machinesCount ?? 0} / {policy?.attributes.maxMachines || '∞'} máq.
                            </span>
                            {l.attributes.expiry && (
                              <span className="text-[10px] text-gray-400">
                                Vence: {new Date(l.attributes.expiry).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 flex gap-2 justify-end items-center">
                          <CopyButton textToCopy={l.attributes.key} />
                          <a 
                            href={`?view=licenses&action=edit&id=${l.id}`}
                            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </a>
                          <form action={deleteResource}>
                            <input type="hidden" name="type" value="license"/>
                            <input type="hidden" name="id" value={l.id}/>
                            <button className="text-red-600 hover:text-red-800 p-1 transition-colors"><Trash2 size={18}/></button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Mensaje de Tabla Vacía */}
                  {((currentView === 'products' && products.length === 0) || 
                    (currentView === 'policies' && policies.length === 0) || 
                    (currentView === 'users' && users.length === 0) || 
                    (currentView === 'licenses' && licenses.length === 0)) && (
                    <tr>
                      <td colSpan={currentView === 'licenses' ? 5 : 2} className="p-8 text-center text-gray-500 italic">
                        No hay registros para mostrar en esta vista.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </div>

        {}
        {(actionParam === 'new' || (actionParam === 'edit' && editItem)) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
              <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">
                  {actionParam === 'edit' ? 'Editar' : 'Añadir'} {titles[currentView]?.split(' ')[1] || 'Registro'}
                </h3>
                <a href={`?view=${currentView}`} className="text-gray-400 hover:text-gray-800 transition-colors bg-white rounded-full p-1 shadow-sm border border-gray-200">
                  <X size={20}/>
                </a>
              </div>
              
              <form action={
                actionParam === 'edit' ? (
                  currentView === 'products' ? updateProduct :
                  currentView === 'policies' ? updatePolicy :
                  currentView === 'users' ? updateUser :
                  updateLicense
                ) : (
                  currentView === 'products' ? createProduct :
                  currentView === 'policies' ? createPolicy :
                  currentView === 'users' ? createUser :
                  createLicense
                )
              }>
                <input type="hidden" name="id" value={editItem?.id || ''} />

                <div className="p-6 space-y-5">
                  {/* Formulario de Producto */}
                  {currentView === 'products' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del Producto</label>
                        <input 
                          type="text" 
                          name="name" 
                          defaultValue={editItem?.attributes?.name || ''} 
                          required 
                          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900" 
                          placeholder="Ej: Mi Aplicación v1.0" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sitio Web (URL Opcional)</label>
                        <input 
                          type="url" 
                          name="url" 
                          defaultValue={editItem?.attributes?.url || ''} 
                          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900" 
                          placeholder="https://mi-aplicacion.com" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Formulario de Política */}
                  {currentView === 'policies' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la Política</label>
                        <input 
                          type="text" 
                          name="name" 
                          defaultValue={editItem?.attributes?.name || ''} 
                          required 
                          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900" 
                          placeholder="Ej: Licencia Pro (Mensual)" 
                        />
                      </div>
                      {actionParam === 'new' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Producto Asociado</label>
                          <select 
                            name="productId" 
                            defaultValue={editItem?.relationships?.product?.data?.id || ''} 
                            required 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all shadow-sm text-gray-900"
                          >
                            <option value="">Selecciona un producto...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.attributes.name}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Límite Máquinas</label>
                          <input 
                            type="number" 
                            name="maxMachines" 
                            defaultValue={editItem?.attributes?.maxMachines || 1} 
                            min={1} 
                            required 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duración (Días)</label>
                          <input 
                            type="number" 
                            name="durationDays" 
                            defaultValue={editItem?.attributes?.duration ? editItem.attributes.duration / 86400 : ''} 
                            min={1} 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900"
                            placeholder="Vacío = Perpetua"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                          <input type="checkbox" name="strict" defaultChecked={editItem?.attributes?.strict !== false} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                          Modo Estricto
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                          <input type="checkbox" name="floating" defaultChecked={editItem?.attributes?.floating === true} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                          Licencia Flotante
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Formulario de Usuario */}
                  {currentView === 'users' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                      <input 
                        type="email" 
                        name="email" 
                        defaultValue={editItem?.attributes?.email || ''} 
                        required 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900" 
                        placeholder="usuario@ejemplo.com" 
                      />
                    </div>
                  )}

                  {/* Formulario de Licencia */}
                  {currentView === 'licenses' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario Propietario</label>
                        <select 
                          name="userId" 
                          defaultValue={editItem?.relationships?.user?.data?.id || ''} 
                          required 
                          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all shadow-sm text-gray-900"
                        >
                          <option value="">Selecciona un usuario...</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.attributes.email}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Política de la Licencia</label>
                        <select 
                          name="policyId" 
                          defaultValue={editItem?.relationships?.policy?.data?.id || ''} 
                          required 
                          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all shadow-sm text-gray-900"
                        >
                          <option value="">Selecciona una política...</option>
                          {policies.map(p => <option key={p.id} value={p.id}>{p.attributes.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Vencimiento (Sobrescribir)</label>
                        <input 
                          type="datetime-local" 
                          name="expiry" 
                          defaultValue={editItem?.attributes?.expiry ? editItem.attributes.expiry.slice(0, 16) : ''} 
                          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Déjalo en blanco para heredar la duración de la Política.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
                  <a href={`?view=${currentView}`} className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-sm">
                    Cancelar
                  </a>
                  <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                    {actionParam === 'edit' ? 'Actualizar Registro' : 'Guardar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}