'use client'; // Esto es obligatorio para que funcione el onClick
import { Copy } from 'lucide-react';

export default function CopyButton({ textToCopy }: { textToCopy: string }) {
return (
<button onClick={() => navigator.clipboard.writeText(textToCopy)}
className="text-blue-600 hover:text-blue-800"
title="Copiar al portapapeles">
  <Copy />
</button>

);
}