import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Layout } from '@nimbus-ds/patterns';
import { Card, Text, Button, Box, Title, Spinner, Tag } from '@nimbus-ds/components';
import { PlusCircleIcon, ChevronRightIcon } from '@nimbus-ds/icons';
import axios from '@/app/Axios';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await axios.get('/ab-tests');
      setTests(res.data);
    } catch (e) {
      console.error('Failed to fetch tests', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page maxWidth="800px">
      <Page.Header
        title="Tests A/B"
        buttonStack={
          <Button appearance="primary" onClick={() => navigate('/tests/new')}>
            Nuevo Test
          </Button>
        }
      />
      <Page.Body>
        <Layout columns="1">
          <Layout.Section>
            {loading ? (
              <Box display="flex" justifyContent="center" padding="4">
                <Spinner />
              </Box>
            ) : tests.length === 0 ? (
              <Card>
                <Card.Body>
                  <Text>No tenés ningún Test A/B activo. ¡Creá uno para empezar a optimizar tus ventas!</Text>
                </Card.Body>
              </Card>
            ) : (
              tests.map(test => (
                <Box mb="4" key={test.id}>
                  <Card onClick={() => navigate(`/tests/${test.id}`)}>
                    <Card.Body>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Title as="h5">{test.name}</Title>
                          <Box display="flex" gap="2" mt="2">
                            <Tag appearance={test.status === "ACTIVE" ? "success" : "neutral"}>
                               {test.status}
                            </Tag>
                            <Text color="neutral-textDisabled">Original ID: {test.original_product_id}</Text>
                          </Box>
                        </Box>
                        <Button appearance="transparent">
                          Ver Detalles <ChevronRightIcon />
                        </Button>
                      </Box>
                    </Card.Body>
                  </Card>
                </Box>
              ))
            )}
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
};

export default Dashboard;
