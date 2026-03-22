import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Layout } from '@nimbus-ds/patterns';
import { Card, Text, Button, Box, Input, Spinner, Select } from '@nimbus-ds/components';
import axios from '@/app/Axios';

const CreateTest: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    original_product_id: '',
    variantName: '',
    variantDescription: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch products to populate dropdown
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.original_product_id) return;
    setIsSubmitting(true);
    try {
      await axios.post('/ab-tests', {
        name: formData.name,
        original_product_id: Number(formData.original_product_id),
        variant_modifications: {
          name: formData.variantName,
          description: formData.variantDescription
        }
      });
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Error al crear el test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productOptions = products.map(p => ({
    label: p.name?.es || p.name?.pt || p.name?.en || 'Sin nombre',
    value: String(p.id)
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
                      onChange={(e: any) => setFormData({...formData, name: e.target.value})}
                    />
                  </Box>
                  
                  {loadingProducts ? <Spinner /> : (
                    <Box>
                      <Text>Seleccionar Producto Original</Text>
                      <Select
                        id="product"
                        name="product"
                        value={formData.original_product_id}
                        onChange={(e: any) => setFormData({...formData, original_product_id: e.target.value})}
                      >
                        <option value="">Seleccione un producto...</option>
                        {productOptions.map(o => (
                           <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </Box>
                  )}
                </Box>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header title="Modificaciones para la Variante B" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Text>El producto variante será un clon exacto del original, pero con estos cambios aplicados automáticamente:</Text>
                  
                  <Box>
                    <Text>Nuevo Título del Producto</Text>
                    <Input
                      name="variantName"
                      placeholder="Opcional. Ej: Zapatillas Urbanas (Rebaja)"
                      value={formData.variantName}
                      onChange={(e: any) => setFormData({...formData, variantName: e.target.value})}
                    />
                  </Box>

                  <Box>
                    <Text>Nueva Descripción HTML</Text>
                    <Input
                      name="variantDescription"
                      placeholder="Opcional."
                      value={formData.variantDescription}
                      onChange={(e: any) => setFormData({...formData, variantDescription: e.target.value})}
                    />
                  </Box>

                </Box>
              </Card.Body>
            </Card>

            <Box mt="4" display="flex" justifyContent="flex-end">
              <Button appearance="primary" onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.original_product_id}>
                {isSubmitting ? <Spinner color="currentColor" /> : "Crear y Lanzar Test"}
              </Button>
            </Box>
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
};

export default CreateTest;
