import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Layout } from '@nimbus-ds/patterns';
import { Card, Text, Button, Box, Title, Spinner, Tag } from '@nimbus-ds/components';
import axios from '@/app/Axios';

const TestDetail: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await axios.get(`/ab-tests/${id}`);
      setTest(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que querés eliminar este test? Esto borrará el producto variante de Tiendanube.")) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/ab-tests/${id}`);
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Error eliminando');
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    const newStatus = test.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await axios.patch(`/ab-tests/${id}`, { status: newStatus });
      fetchTest();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Box p="8"><Spinner/></Box>;
  if (!test) return <Text>No encontrado</Text>;

  const totalViews = test.original_views + test.variant_views || 1; // avoid /0
  const originalConv = test.original_views ? ((test.original_sales / test.original_views) * 100).toFixed(2) : '0.00';
  const variantConv = test.variant_views ? ((test.variant_sales / test.variant_views) * 100).toFixed(2) : '0.00';

  return (
    <Page maxWidth="800px">
      <Page.Header
        title={test.name}
        buttonStack={<Button onClick={() => navigate('/')}>Volver</Button>}
      />
      <Page.Body>
        <Layout columns="2 - symmetric">
          <Layout.Section>
            <Card>
              <Card.Header title="Grupo A (Original)" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Tag appearance="neutral">ID: {test.original_product_id}</Tag>
                  <Box>
                    <Text color="neutral-textDisabled">Vistas</Text>
                    <Title as="h3">{test.original_views}</Title>
                  </Box>
                  <Box>
                    <Text color="neutral-textDisabled">Ventas (Items)</Text>
                    <Title as="h3">{test.original_sales}</Title>
                  </Box>
                  <Box>
                    <Text color="neutral-textDisabled">Tasa de Conversión</Text>
                    <Title as="h3">{originalConv}%</Title>
                  </Box>
                </Box>
              </Card.Body>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Card.Header title="Grupo B (Variante)" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Tag appearance="primary">ID: {test.variant_product_id}</Tag>
                  <Box>
                    <Text color="neutral-textDisabled">Vistas</Text>
                    <Title as="h3">{test.variant_views}</Title>
                  </Box>
                  <Box>
                    <Text color="neutral-textDisabled">Ventas (Items)</Text>
                    <Title as="h3">{test.variant_sales}</Title>
                  </Box>
                  <Box>
                    <Text color="neutral-textDisabled">Tasa de Conversión</Text>
                    <Title as="h3">{variantConv}%</Title>
                  </Box>
                </Box>
              </Card.Body>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Card.Header title="Administración del Test" />
              <Card.Body>
                <Box display="flex" gap="4">
                  <Button appearance={test.status === "ACTIVE" ? "neutral" : "primary"} onClick={handleToggle}>
                    {test.status === "ACTIVE" ? "Pausar Test" : "Reactivar Test"}
                  </Button>
                  <Button appearance="danger" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Spinner color="currentColor" /> : "Eliminar Test y Variante"}
                  </Button>
                </Box>
              </Card.Body>
            </Card>
          </Layout.Section>

        </Layout>
      </Page.Body>
    </Page>
  );
};

export default TestDetail;
