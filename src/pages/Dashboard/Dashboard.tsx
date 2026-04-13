import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Layout } from '@nimbus-ds/patterns';
import { Card, Text, Button, Box, Title, Spinner, Tag, Thumbnail } from '@nimbus-ds/components';
import { ChevronRightIcon } from '@nimbus-ds/icons';
import axios from '@/app/Axios';

const statusAppearance: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  FINISHED: 'neutral',
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/ab-tests')
      .then(res => setTests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page maxWidth="800px">
      <Page.Header
        title="Tests A/B"
        buttonStack={
          <Box display="flex" gap="2">
            <Button appearance="transparent" onClick={() => navigate('/tests/history')}>
              Historial
            </Button>
            <Button appearance="primary" onClick={() => navigate('/tests/new')}>
              Nuevo Test
            </Button>
          </Box>
        }
      />
      <Page.Body>
        <Layout columns="1">
          <Layout.Section>
            {loading ? (
              <Box display="flex" justifyContent="center" padding="4"><Spinner /></Box>
            ) : tests.length === 0 ? (
              <Card>
                <Card.Body>
                  <Text>No tenés ningún Test A/B activo. ¡Creá uno para empezar a optimizar tus ventas!</Text>
                </Card.Body>
              </Card>
            ) : (
              <Box display="flex" flexDirection="column" gap="4">
                {tests.map(test => (
                  <Card key={test.id} onClick={() => navigate(`/tests/${test.id}`)}>
                    <Card.Body>
                      <Box display="flex" gap="4" alignItems="center">
                        <Thumbnail
                          src={test.product_image_url || ''}
                          alt={test.product_name || test.name}
                          width="72px"
                        />
                        <Box flex="1" display="flex" flexDirection="column" gap="1">
                          <Title as="h5">{test.name}</Title>
                          {test.product_name && (
                            <Text fontSize="caption" color="neutral-textDisabled">
                              {test.product_name}
                            </Text>
                          )}
                          <Box display="flex" gap="2" alignItems="center" mt="1">
                            <Tag appearance={statusAppearance[test.status] || 'neutral'}>
                              {test.status}
                            </Tag>
                            <Text fontSize="caption" color="neutral-textDisabled">
                              Creado: {new Date(test.created_at).toLocaleDateString('es-AR')}
                            </Text>
                          </Box>
                        </Box>
                        <Button appearance="transparent">
                          <ChevronRightIcon />
                        </Button>
                      </Box>
                    </Card.Body>
                  </Card>
                ))}
              </Box>
            )}
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
};

export default Dashboard;
