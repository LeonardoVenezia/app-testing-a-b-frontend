import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Layout } from '@nimbus-ds/patterns';
import {
  Card,
  Text,
  Button,
  Box,
  Input,
  Spinner,
  Select,
  Icon,
  Tag,
} from '@nimbus-ds/components';
import { PlusCircleIcon, TrashIcon } from '@nimbus-ds/icons';
import axios from '@/app/Axios';

interface ImageRow {
  id: number;
  src: string;
}

const CreateTest: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    original_product_id: '',
    variantName: '',
    variantDescription: '',
    variantPrice: '',
  });

  // Dynamic list of image/video URLs
  const [imageRows, setImageRows] = useState<ImageRow[]>([]);
  const [nextImageId, setNextImageId] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get('/products')
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  // ── Image row helpers ──────────────────────────────────────────────────────

  const addImageRow = () => {
    setImageRows((prev) => [...prev, { id: nextImageId, src: '' }]);
    setNextImageId((n) => n + 1);
  };

  const removeImageRow = (id: number) => {
    setImageRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateImageRow = (id: number, value: string) => {
    setImageRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, src: value } : r))
    );
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!formData.name || !formData.original_product_id) return;
    setIsSubmitting(true);

    // Only send images that actually have a URL filled in
    const filledImages = imageRows
      .filter((r) => r.src.trim() !== '')
      .map((r) => ({ src: r.src.trim() }));

    try {
      await axios.post('/ab-tests', {
        name: formData.name,
        original_product_id: Number(formData.original_product_id),
        variant_modifications: {
          ...(formData.variantName && { name: formData.variantName }),
          ...(formData.variantDescription && {
            description: formData.variantDescription,
          }),
          ...(formData.variantPrice && { price: formData.variantPrice }),
          ...(filledImages.length > 0 && { images: filledImages }),
        },
      });
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Error al crear el test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productOptions = products.map((p) => ({
    label: p.name?.es || p.name?.pt || p.name?.en || 'Sin nombre',
    value: String(p.id),
  }));

  return (
    <Page maxWidth="800px">
      <Page.Header
        title="Crear Nuevo Test"
        buttonStack={<Button onClick={() => navigate('/')}>Volver</Button>}
      />
      <Page.Body>
        <Layout columns="1">
          <Layout.Section>

            {/* ── Configuración general ── */}
            <Card>
              <Card.Header title="Configuración del Test" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Box>
                    <Text>Nombre del Test (interno)</Text>
                    <Input
                      name="name"
                      placeholder="Ej: Prueba de precio en Zapatillas"
                      value={formData.name}
                      onChange={(e: any) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </Box>

                  {loadingProducts ? (
                    <Spinner />
                  ) : (
                    <Box>
                      <Text>Seleccionar Producto Original</Text>
                      <Select
                        id="product"
                        name="product"
                        value={formData.original_product_id}
                        onChange={(e: any) =>
                          setFormData({
                            ...formData,
                            original_product_id: e.target.value,
                          })
                        }
                      >
                        <option value="">Seleccione un producto...</option>
                        {productOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </Box>
                  )}
                </Box>
              </Card.Body>
            </Card>

            {/* ── Modificaciones para la Variante B ── */}
            <Card>
              <Card.Header title="Modificaciones para la Variante B" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Text>
                    El producto variante será un clon exacto del original, pero con
                    estos cambios aplicados automáticamente. Todos los campos son
                    opcionales.
                  </Text>

                  {/* Título */}
                  <Box>
                    <Text fontWeight="bold">Nuevo Título del Producto</Text>
                    <Input
                      name="variantName"
                      placeholder="Ej: Zapatillas Urbanas (Rebaja)"
                      value={formData.variantName}
                      onChange={(e: any) =>
                        setFormData({ ...formData, variantName: e.target.value })
                      }
                    />
                  </Box>

                  {/* Descripción */}
                  <Box>
                    <Text fontWeight="bold">Nueva Descripción HTML</Text>
                    <Input
                      name="variantDescription"
                      placeholder="Opcional. Puede incluir HTML."
                      value={formData.variantDescription}
                      onChange={(e: any) =>
                        setFormData({
                          ...formData,
                          variantDescription: e.target.value,
                        })
                      }
                    />
                  </Box>

                  {/* Precio */}
                  <Box>
                    <Text fontWeight="bold">Nuevo Precio (todas las variantes)</Text>
                    <Text fontSize="caption">
                      Si se ingresa, reemplaza el precio de todas las variantes del
                      producto B. Dejá vacío para conservar el precio original.
                    </Text>
                    <Input
                      name="variantPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 1999.99"
                      value={formData.variantPrice}
                      onChange={(e: any) =>
                        setFormData({ ...formData, variantPrice: e.target.value })
                      }
                    />
                  </Box>

                  {/* Imágenes / Videos */}
                  <Box>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb="2"
                    >
                      <Box display="flex" flexDirection="column" gap="1">
                        <Text fontWeight="bold">
                          Imágenes / Videos del Producto B
                        </Text>
                        <Text fontSize="caption">
                          Agregá URLs públicas de imágenes. Si no agregás ninguna,
                          se copian las imágenes del producto original.
                        </Text>
                      </Box>
                      <Button onClick={addImageRow}>
                        <Icon source={<PlusCircleIcon />} />
                        Agregar URL
                      </Button>
                    </Box>

                    {imageRows.length === 0 ? (
                      <Box
                        backgroundColor="neutral-surface"
                        borderRadius="base"
                        padding="4"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="neutral-textDisabled" fontSize="caption">
                          Sin imágenes configuradas — se usarán las del original
                        </Text>
                      </Box>
                    ) : (
                      <Box display="flex" flexDirection="column" gap="2">
                        {imageRows.map((row, index) => (
                          <Box
                            key={row.id}
                            display="flex"
                            alignItems="center"
                            gap="2"
                          >
                            <Tag appearance="neutral">
                              <Text fontSize="caption">{index + 1}</Text>
                            </Tag>
                            <Box flex="1">
                              <Input
                                name={`image-${row.id}`}
                                type="url"
                                placeholder="https://cdn.ejemplo.com/imagen.jpg"
                                value={row.src}
                                onChange={(e: any) =>
                                  updateImageRow(row.id, e.target.value)
                                }
                              />
                            </Box>
                            <Button
                              appearance="danger"
                              onClick={() => removeImageRow(row.id)}
                            >
                              <Icon source={<TrashIcon />} />
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Card.Body>
            </Card>

            {/* ── CTA ── */}
            <Box mt="4" display="flex" justifyContent="flex-end">
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !formData.name ||
                  !formData.original_product_id
                }
              >
                {isSubmitting ? (
                  <Spinner color="currentColor" />
                ) : (
                  'Crear y Lanzar Test'
                )}
              </Button>
            </Box>
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
};

export default CreateTest;
