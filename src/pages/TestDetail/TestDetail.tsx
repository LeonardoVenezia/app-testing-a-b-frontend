import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Layout } from '@nimbus-ds/patterns';
import { Card, Text, Button, Box, Spinner, Tag } from '@nimbus-ds/components';
import axios from '@/app/Axios';

interface VariantMetrics {
  unique_views: number;
  avg_time_on_page: number;
  image_clicks: number;
  description_interactions: number;
  add_to_cart: number;
  checkout_started: number;
  orders_completed: number;
  orders_paid: number;
  revenue: number;
  paid_revenue: number;
  conversion_rate: number;
  aov: number;
  add_to_cart_rate: number;
  checkout_rate: number;
  purchase_rate: number;
}

interface Metrics { A: VariantMetrics; B: VariantMetrics; }

const fmt = (n: number, decimals = 2) => Number(n).toFixed(decimals);
const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function MetricRow({ label, valueA, valueB, format = 'number' }: { label: string; valueA: number; valueB: number; format?: 'number' | 'percent' | 'currency' | 'seconds' }) {
  const render = (v: number) => {
    switch (format) {
      case 'percent': return fmt(v) + '%';
      case 'currency': return fmtCurrency(v);
      case 'seconds': return fmt(v, 1) + 's';
      default: return String(Math.round(v));
    }
  };
  const better = valueA > valueB ? 'A' : valueB > valueA ? 'B' : null;

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" padding="2" borderColor="neutral-surfaceHighlight" borderStyle="solid" borderWidth="none" borderBottomWidth="1">
      <Box width="40%"><Text fontSize="caption">{label}</Text></Box>
      <Box width="25%" textAlign="center">
        <Text fontWeight={better === 'A' ? 'bold' : 'regular'} color={better === 'A' ? 'success-textLow' : 'neutral-textLow'}>
          {render(valueA)}
        </Text>
      </Box>
      <Box width="25%" textAlign="center">
        <Text fontWeight={better === 'B' ? 'bold' : 'regular'} color={better === 'B' ? 'success-textLow' : 'neutral-textLow'}>
          {render(valueB)}
        </Text>
      </Box>
    </Box>
  );
}

function determineWinner(m: Metrics): { winner: string | null; confidence: string } {
  const a = m.A, b = m.B;
  if (a.unique_views < 30 && b.unique_views < 30) return { winner: null, confidence: 'Datos insuficientes (mín. 30 vistas por variante)' };

  const crA = a.conversion_rate, crB = b.conversion_rate;
  if (crA === 0 && crB === 0) return { winner: null, confidence: 'Sin conversiones aún' };

  const diff = Math.abs(crA - crB);
  const avg = (crA + crB) / 2 || 1;
  const relDiff = (diff / avg) * 100;

  if (relDiff < 5) return { winner: null, confidence: `Diferencia marginal (${fmt(relDiff, 1)}%). Necesitás más datos.` };
  if (relDiff < 15) return { winner: crA > crB ? 'A' : 'B', confidence: `Tendencia leve (${fmt(relDiff, 1)}% diferencia relativa). Seguí recopilando datos.` };
  return { winner: crA > crB ? 'A' : 'B', confidence: `Diferencia significativa (${fmt(relDiff, 1)}% relativa).` };
}

const TestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`/ab-tests/${id}`),
      axios.get(`/api/track/metrics/${id}`),
    ])
      .then(([testRes, metricsRes]) => {
        setTest(testRes.data);
        setMetrics(metricsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que querés eliminar este test? Esto borrará el producto variante de Tiendanube.')) return;
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
    const newStatus = test.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await axios.patch(`/ab-tests/${id}`, { status: newStatus });
      const res = await axios.get(`/ab-tests/${id}`);
      setTest(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" padding="8"><Spinner /></Box>;
  if (!test || !metrics) return <Text>No encontrado</Text>;

  const { winner, confidence } = determineWinner(metrics);

  return (
    <Page maxWidth="900px">
      <Page.Header
        title={test.name}
        buttonStack={<Button onClick={() => navigate('/')}>Volver</Button>}
      />
      <Page.Body>
        <Layout columns="1">
          {/* Winner banner */}
          <Layout.Section>
            <Card>
              <Card.Body>
                <Box display="flex" alignItems="center" gap="4">
                  <Tag appearance={winner ? 'success' : 'neutral'}>
                    {winner ? `🏆 Ganador: Grupo ${winner} (${winner === 'A' ? 'Original' : 'Variante'})` : '⏳ Sin ganador definido'}
                  </Tag>
                  <Text fontSize="caption" color="neutral-textDisabled">{confidence}</Text>
                </Box>
              </Card.Body>
            </Card>
          </Layout.Section>

          {/* Funnel table */}
          <Layout.Section>
            <Card>
              <Card.Header title="Embudo de Conversión Completo" />
              <Card.Body>
                {/* Header row */}
                <Box display="flex" justifyContent="space-between" padding="2" mb="2">
                  <Box width="40%"><Text fontWeight="bold" fontSize="caption">Métrica</Text></Box>
                  <Box width="25%" textAlign="center"><Tag appearance="neutral">A (Original)</Tag></Box>
                  <Box width="25%" textAlign="center"><Tag appearance="primary">B (Variante)</Tag></Box>
                </Box>

                {/* Top of Funnel */}
                <Box mb="2"><Text fontWeight="bold" fontSize="caption" color="neutral-textDisabled">🔍 Visibilidad</Text></Box>
                <MetricRow label="Vistas Únicas" valueA={metrics.A.unique_views} valueB={metrics.B.unique_views} />
                <MetricRow label="Tiempo Promedio en Página" valueA={metrics.A.avg_time_on_page} valueB={metrics.B.avg_time_on_page} format="seconds" />

                {/* Middle of Funnel */}
                <Box mt="4" mb="2"><Text fontWeight="bold" fontSize="caption" color="neutral-textDisabled">👆 Interacción y Micro-conversiones</Text></Box>
                <MetricRow label="Clics en Imágenes" valueA={metrics.A.image_clicks} valueB={metrics.B.image_clicks} />
                <MetricRow label="Interacción con Descripción" valueA={metrics.A.description_interactions} valueB={metrics.B.description_interactions} />
                <MetricRow label="Agregar al Carrito" valueA={metrics.A.add_to_cart} valueB={metrics.B.add_to_cart} />
                <MetricRow label="Tasa Add-to-Cart" valueA={metrics.A.add_to_cart_rate} valueB={metrics.B.add_to_cart_rate} format="percent" />
                <MetricRow label="Iniciar Checkout" valueA={metrics.A.checkout_started} valueB={metrics.B.checkout_started} />
                <MetricRow label="Tasa Checkout (ATC→Checkout)" valueA={metrics.A.checkout_rate} valueB={metrics.B.checkout_rate} format="percent" />

                {/* Bottom of Funnel */}
                <Box mt="4" mb="2"><Text fontWeight="bold" fontSize="caption" color="neutral-textDisabled">💰 Macro-conversiones y Monetización</Text></Box>
                <MetricRow label="Órdenes Completadas" valueA={metrics.A.orders_completed} valueB={metrics.B.orders_completed} />
                <MetricRow label="Órdenes Pagadas" valueA={metrics.A.orders_paid} valueB={metrics.B.orders_paid} />
                <MetricRow label="Tasa de Compra (Checkout→Orden)" valueA={metrics.A.purchase_rate} valueB={metrics.B.purchase_rate} format="percent" />
                <MetricRow label="Tasa de Conversión (CR)" valueA={metrics.A.conversion_rate} valueB={metrics.B.conversion_rate} format="percent" />
                <MetricRow label="Ingresos (Revenue)" valueA={metrics.A.revenue} valueB={metrics.B.revenue} format="currency" />
                <MetricRow label="Ingresos Pagados" valueA={metrics.A.paid_revenue} valueB={metrics.B.paid_revenue} format="currency" />
                <MetricRow label="Valor Promedio de Pedido (AOV)" valueA={metrics.A.aov} valueB={metrics.B.aov} format="currency" />
              </Card.Body>
            </Card>
          </Layout.Section>

          {/* Admin controls */}
          <Layout.Section>
            <Card>
              <Card.Header title="Administración del Test" />
              <Card.Body>
                <Box display="flex" gap="4" alignItems="center">
                  <Tag appearance={test.status === 'ACTIVE' ? 'success' : 'neutral'}>{test.status}</Tag>
                  <Button appearance={test.status === 'ACTIVE' ? 'neutral' : 'primary'} onClick={handleToggle}>
                    {test.status === 'ACTIVE' ? 'Pausar Test' : 'Reactivar Test'}
                  </Button>
                  <Button appearance="danger" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Spinner color="currentColor" /> : 'Eliminar Test y Variante'}
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
