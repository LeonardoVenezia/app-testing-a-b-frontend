import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Layout } from '@nimbus-ds/patterns';
import {
  Card,
  Text,
  Button,
  Box,
  Input,
  Spinner,
  Icon,
  Select,
  Textarea,
} from '@nimbus-ds/components';
import { PlusCircleIcon, ChevronDownIcon, PictureIcon } from '@nimbus-ds/icons';
import axios from '@/app/Axios';

interface ImageRow {
  id: number;
  src: string; // Used for preview URL (ObjectURL) or public URL
  attachment?: string; // Base64 string if it's a local file
  filename?: string;
}

const CreateTest: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Configuracion del Test (Sidebar)
  const [testName, setTestName] = useState('');
  const [originalProductId, setOriginalProductId] = useState('');

  // Modificaciones (Principal, como en TN)
  const [variantName, setVariantName] = useState('');
  const [variantDescription, setVariantDescription] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantVideoUrl, setVariantVideoUrl] = useState('');

  // Images 
  const [imageRows, setImageRows] = useState<ImageRow[]>([]);
  const [nextImageId, setNextImageId] = useState(1);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get('/products')
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  const addImageUrl = () => {
    if (tempImageUrl.trim()) {
      setImageRows((prev) => [...prev, { id: nextImageId, src: tempImageUrl.trim() }]);
      setNextImageId((n) => n + 1);
      setTempImageUrl('');
      setShowImageUrlInput(false);
    }
  };

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const objectUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const base64Str = event.target.result.split(',')[1];
          setImageRows((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              src: objectUrl,
              attachment: base64Str,
              filename: file.name,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeImageRow = (id: number) => {
    setImageRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async () => {
    if (!testName || !originalProductId) return;
    setIsSubmitting(true);

    const filledImages = imageRows.map((r) => {
      if (r.attachment && r.filename) {
        return { attachment: r.attachment, filename: r.filename };
      }
      return { src: r.src };
    });

    try {
      await axios.post('/ab-tests', {
        name: testName,
        original_product_id: Number(originalProductId),
        variant_modifications: {
          ...(variantName && { name: variantName }),
          ...(variantDescription && { description: variantDescription }),
          ...(variantPrice && { price: variantPrice }),
          ...(variantVideoUrl && { video_url: variantVideoUrl }),
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
    <Page maxWidth="1200px">
      <Page.Header
        title="Crear Nuevo Test A/B"
        buttonStack={
          <Box display="flex" gap="2">
            <Button onClick={() => navigate('/')}>Cancelar</Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !testName || !originalProductId}
            >
              {isSubmitting ? <Spinner color="currentColor" /> : 'Lanzar Test'}
            </Button>
          </Box>
        }
      />
      
      <Page.Body>
        <Layout columns="2 - asymmetric">
          {/* COLUMNA PRINCIPAL - Modificaciones de Variantes, parece crear un producto */}
          <Layout.Section>
            
            {/* 1. Nombre y descripción */}
            <Box mb="4">
              <Card>
                <Card.Header title="Nombre y descripción (Variante)" />
                <Card.Body>
                  <Box display="flex" flexDirection="column" gap="4">
                    <Text fontSize="caption" color="neutral-textDisabled">
                      Estos datos sobreescribirán temporalmente el producto base para el Grupo B.
                    </Text>
                    <Box>
                      <Box mb="1">
                        <Text fontWeight="bold">Nombre</Text>
                      </Box>
                      <Input
                        name="variantName"
                        placeholder="Ej: Remera Classic (Optimizada)"
                        value={variantName}
                        onChange={(e: any) => setVariantName(e.target.value)}
                      />
                    </Box>
                  <Box>
                    <Box mb="1">
                      <Text fontWeight="bold">Descripción HTML</Text>
                    </Box>
                    {/* En Nimbus no hay editor rico en el pattern básico de App, usamos Textarea simulando TN */}
                    <Textarea
                      id="variantDescription"
                      name="variantDescription"
                      placeholder="Descripción opcional"
                      value={variantDescription}
                      onChange={(e: any) => setVariantDescription(e.target.value)}
                      // @ts-ignore
                      rows={6}
                    />
                  </Box>
                </Box>
              </Card.Body>
            </Card>
          </Box>

            {/* 2. Fotos y video (Unificado) */}
            <Box mb="4">
              <Card>
                <Card.Header 
                  title="Fotos y video" 
                />
                <Card.Body>
                  <Box display="flex" flexDirection="column" gap="4">
                    
                    {/* Caja Dashed (Arrastrar y soltar) */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        border: `2px dashed ${isDragging ? '#0040AA' : '#0052CC'}`,
                        borderRadius: '4px',
                        backgroundColor: isDragging ? '#E8F0FE' : '#F4F5F7',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: '32px 16px',
                        textAlign: 'center',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        userSelect: 'none',
                      }}
                    >
                      <Icon source={<PlusCircleIcon />} color="primary-interactive" />
                      <Box mt="2">
                        <Text color="primary-interactive" fontWeight="bold">
                          Arrastrá y soltá, o subí fotos del producto
                        </Text>
                      </Box>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />

                    <Box display="flex" gap="2" alignItems="center">
                      <Icon source={<PictureIcon />} color="neutral-textDisabled" />
                      <Text fontSize="caption" color="neutral-textDisabled">
                        Tamaño mínimo recomendado: 1024px / Formatos recomendados: WEBP, PNG, JPEG o GIF
                      </Text>
                    </Box>

                    {/* Previews (si existen) */}
                    {imageRows.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                        {imageRows.map((row) => (
                          <div
                            key={row.id}
                            style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: '4px',
                                overflow: 'hidden',
                                border: '1px solid #DFE3E8',
                                backgroundColor: '#fff',
                              }}
                            >
                              <img
                                src={row.src}
                                alt=""
                                style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
                              />
                              <button
                                onClick={() => removeImageRow(row.id)}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  width: '24px',
                                  height: '24px',
                                  padding: 0,
                                  border: 'none',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(220, 38, 38, 0.85)',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  lineHeight: 1,
                                }}
                                title="Eliminar imagen"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Editor / URL Tool */}
                    <Box mt="1">
                      {!showImageUrlInput ? (
                        <Box>
                          <Button appearance="transparent" onClick={() => setShowImageUrlInput(true)}>
                            Editar fotos o pegar URL
                          </Button>
                        </Box>
                      ) : (
                        <Box display="flex" gap="2" alignItems="center">
                          <Input
                            name="newImageUrl"
                            placeholder="https://tutienda.com/img.jpg"
                            value={tempImageUrl}
                            onChange={(e: any) => setTempImageUrl(e.target.value)}
                          />
                          <Button appearance="neutral" onClick={addImageUrl}>Agregar</Button>
                          <Button appearance="transparent" onClick={() => setShowImageUrlInput(false)}>Cancelar</Button>
                        </Box>
                      )}
                    </Box>

                    {/* Divisor y Video */}
                    <Box style={{ borderTop: '1px solid #DFE3E8', margin: '8px -16px 0 -16px', padding: '16px 16px 0 16px' }}>
                      <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        cursor="pointer" 
                        onClick={() => setShowVideoInput(!showVideoInput)}
                      >
                        <Box>
                          <Box mb="1"><Text fontWeight="bold">Link para video externo</Text></Box>
                          <Text fontSize="caption" color="neutral-textHigh">Pegá un link de Youtube o de Vimeo sobre tu producto</Text>
                        </Box>
                        <Icon source={<ChevronDownIcon />} />
                      </Box>
                      
                      {showVideoInput && (
                        <Box mt="2">
                          <Input
                            name="variantVideoUrl"
                            placeholder="Ej: https://youtube.com/watch?v=..."
                            value={variantVideoUrl}
                            onChange={(e: any) => setVariantVideoUrl(e.target.value)}
                          />
                        </Box>
                      )}
                    </Box>

                  </Box>
                </Card.Body>
              </Card>
            </Box>

            {/* 3. Precios */}
            <Box mb="4">
              <Card>
                <Card.Header title="Precio (Variante)" />
                <Card.Body>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap="4">
                    <Box>
                      <Box mb="1"><Text fontWeight="bold">Precio original</Text></Box>
                      <Input
                        name="variantPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="$"
                        value={variantPrice}
                        onChange={(e: any) => setVariantPrice(e.target.value)}
                      />
                    </Box>
                    <Box>
                      <Box mb="1"><Text fontWeight="bold">Precio promocional</Text></Box>
                      <Input
                        name="placeholderPromo"
                        type="number"
                        placeholder="$ (No disponible en MVP)"
                        disabled
                      />
                    </Box>
                  </Box>
                </Card.Body>
              </Card>
            </Box>
            
          </Layout.Section>

          {/* COLUMNA LATERAL (Sidebar Style) - Configuración Root */}
          <Layout.Section>
            
            <Card>
              <Card.Header title="Configuración del Test" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Box>
                    <Box mb="1"><Text fontWeight="bold">Nombre interno</Text></Box>
                    <Input
                      name="testName"
                      placeholder="Ej: A/B Pricing Zapatillas"
                      value={testName}
                      onChange={(e: any) => setTestName(e.target.value)}
                    />
                    <Box mt="1">
                      <Text fontSize="caption" color="neutral-textLow">
                        Este nombre es solo referencial para el panel.
                      </Text>
                    </Box>
                  </Box>
                  
                  {loadingProducts ? (
                    <Spinner />
                  ) : (
                    <Box>
                      <Box mb="1"><Text fontWeight="bold">Producto Original</Text></Box>
                      <Select
                        id="originalProductId"
                        name="originalProductId"
                        value={originalProductId}
                        onChange={(e: any) => setOriginalProductId(e.target.value)}
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

            <Box mt="4">
               <Card>
                 <Card.Header title="Resumen" />
                 <Card.Body>
                   <Text fontSize="caption" color="neutral-textHigh">
                     Se creará una versión clonada oculta en la tienda, donde el 50% de los visitantes verá las alteraciones acá listadas.
                   </Text>
                 </Card.Body>
               </Card>
            </Box>

          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
};

export default CreateTest;
