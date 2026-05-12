# React Skills — Food Store

Referencia de patrones y hooks de React usados en este proyecto.

---

## Hooks básicos

### `useState`
Maneja estado local de un componente. Usar cuando el estado no necesita compartirse con otros componentes.

```tsx
const [isOpen, setIsOpen] = useState(false)
```

### `useEffect`
Ejecuta efectos secundarios (fetch, suscripciones, timers) después del render. En este proyecto casi nunca se usa directamente para fetch — eso lo maneja TanStack Query.

```tsx
useEffect(() => {
  document.title = `Carrito (${itemCount})`
}, [itemCount])
```

### `useRef`
Referencia mutable que no re-renderiza. Usar para acceder al DOM o guardar valores entre renders sin disparar re-render.

```tsx
const inputRef = useRef<HTMLInputElement>(null)
```

### `useMemo` / `useCallback`
Memorizan valores y funciones para evitar recálculos innecesarios. Usar solo cuando hay un problema de performance real.

```tsx
const total = useMemo(() => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [items])
```

---

## TanStack Query

### `useQuery` — leer datos del servidor

```tsx
const { data, isLoading, isError } = useQuery({
  queryKey: ['productos', { page, categoriaId }],
  queryFn: () => api.get('/productos', { params: { page, categoria_id: categoriaId } }).then(r => r.data),
})
```

- `queryKey` identifica el cache. Si cambia, TanStack refetch automáticamente.
- `isLoading` solo es true la primera vez. Para refetch usar `isFetching`.
- Nunca usar `useEffect + fetch`. Siempre `useQuery`.

### `useMutation` — escribir datos al servidor

```tsx
const { mutate, isPending } = useMutation({
  mutationFn: (body: ProductoCreate) => api.post('/productos', body).then(r => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['productos'] })
  },
  onError: (error: AxiosError<ApiError>) => {
    toast.error(error.response?.data.detail ?? 'Error desconocido')
  },
})
```

- Después de un mutation exitoso, invalidar el queryKey correspondiente para refetch.
- Nunca mutar el estado del servidor directamente en Zustand.

### `useQueryClient`

```tsx
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['pedidos'] })
queryClient.setQueryData(['producto', id], nuevoProducto)
```

---

## Zustand — stores del cliente

Suscribirse siempre por slice, nunca al store completo:

```tsx
// ✅ Correcto
const user = useAuthStore(s => s.user)
const itemCount = useCartStore(s => s.itemCount())

// ❌ Incorrecto — re-renderiza ante cualquier cambio del store
const store = useAuthStore()
```

Acceso fuera de React (interceptores, funciones utilitarias):

```tsx
const token = useAuthStore.getState().accessToken
```

### Stores disponibles

| Store | Persiste | Qué gestiona |
|---|---|---|
| `authStore` | ✅ | accessToken, refreshToken, user, isAuthenticated |
| `cartStore` | ✅ | items del carrito, totales |
| `paymentStore` | ❌ | estado del proceso MercadoPago |
| `uiStore` | ❌ | cartOpen, sidebarOpen, confirmModal |

---

## React Router v6

```tsx
// Definir rutas
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/productos" element={<ProductosPage />} />
  <Route path="/productos/:id" element={<ProductoDetallePage />} />
  <Route path="/admin/*" element={<ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>} />
</Routes>

// Navegar
const navigate = useNavigate()
navigate('/productos')
navigate(-1) // atrás

// Leer parámetros
const { id } = useParams()
const [searchParams] = useSearchParams()
const page = searchParams.get('page') ?? '1'
```

---

## TanStack Form

```tsx
const form = useForm({
  defaultValues: { email: '', password: '' },
  onSubmit: async ({ value }) => {
    await loginMutation.mutateAsync(value)
  },
})

return (
  <form onSubmit={form.handleSubmit}>
    <form.Field name="email" validators={{ onChange: ({ value }) => !value ? 'Requerido' : undefined }}>
      {(field) => (
        <input
          value={field.state.value}
          onChange={e => field.handleChange(e.target.value)}
        />
      )}
    </form.Field>
  </form>
)
```

---

## Tailwind CSS — convenciones

```tsx
// Condicionales con clsx
import clsx from 'clsx'

<button className={clsx(
  'px-4 py-2 rounded font-medium',
  isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700',
  variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
)}>
  {isPending ? 'Cargando...' : 'Guardar'}
</button>
```

---

## Recharts (para el panel admin)

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={ventasPorDia}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="fecha" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="total" stroke="#2563eb" />
  </LineChart>
</ResponsiveContainer>
```

---

## Patrones importantes

### Separar lógica de presentación

```tsx
// Hook con lógica
function useProductos(categoriaId?: number) {
  return useQuery({
    queryKey: ['productos', categoriaId],
    queryFn: () => fetchProductos(categoriaId),
  })
}

// Componente solo renderiza
function ProductosGrid() {
  const { data, isLoading } = useProductos()
  if (isLoading) return <Spinner />
  return <div>{data?.items.map(p => <ProductoCard key={p.id} producto={p} />)}</div>
}
```

### Manejo de errores de API

```tsx
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types'

onError: (err: AxiosError<ApiError>) => {
  const mensaje = err.response?.data?.detail ?? 'Error inesperado'
  // mostrar toast o setear error en form
}
```
