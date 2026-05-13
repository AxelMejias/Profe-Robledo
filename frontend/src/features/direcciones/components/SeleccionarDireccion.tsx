import { useState } from 'react';
import { useDirecciones } from '@/entities/direccion/hooks';
import { Modal, Button, Badge, Skeleton, EmptyState } from '@/shared/ui';
import { FormDireccion } from './FormDireccion';
import type { DireccionEntrega } from '@/shared/types';

interface SeleccionarDireccionProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (direccion: DireccionEntrega) => void;
  selectedId?: number;
}

export function SeleccionarDireccion({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: SeleccionarDireccionProps) {
  const { data: direcciones, isLoading } = useDirecciones();
  const [showFormModal, setShowFormModal] = useState(false);

  const handleSelect = (direccion: DireccionEntrega) => {
    onSelect(direccion);
    onClose();
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Seleccionar dirección de entrega"
      >
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : !direcciones || direcciones.length === 0 ? (
            <EmptyState
              title="No tenés direcciones guardadas"
              description="Agregá una dirección para continuar con tu pedido."
              action={{ label: 'Agregar dirección', onClick: () => setShowFormModal(true) }}
            />
          ) : (
            <>
              {/* Lista de direcciones */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {direcciones.map((dir) => (
                  <button
                    key={dir.id}
                    onClick={() => handleSelect(dir)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                      selectedId === dir.id
                        ? 'border-primary-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {dir.alias && (
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{dir.alias}</p>
                            {dir.es_principal && (
                              <Badge size="sm" variant="primary">
                                Principal
                              </Badge>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-700">{dir.linea1}</p>
                        {dir.linea2 && (
                          <p className="text-sm text-gray-600">{dir.linea2}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {dir.ciudad}, CP {dir.codigo_postal}
                        </p>
                        {dir.referencia && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            Ref: {dir.referencia}
                          </p>
                        )}
                      </div>
                      {selectedId === dir.id && (
                        <span className="text-primary-500 text-xl ml-2">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Botón agregar nueva */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setShowFormModal(true)}
                  variant="ghost"
                  className="w-full"
                >
                  + Agregar nueva dirección
                </Button>
              </div>
            </>
          )}

          {/* Botón cerrar */}
          <div className="pt-4 border-t">
            <Button onClick={onClose} variant="ghost" className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de formulario (nested modal) */}
      {showFormModal && (
        <FormDireccion
          onClose={handleCloseForm}
        />
      )}
    </>
  );
}

