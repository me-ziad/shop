import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {Box, Typography, TextField, Button, CircularProgress,Avatar, Card, Divider,useTheme} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
  import { useTranslation } from 'react-i18next'
 import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'

export default function AddProduct() {
  const { i18n } = useTranslation()
  const theme = useTheme();
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const isArabic = i18n.language === 'ar'
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [description, setDescription] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const navigate =useNavigate()

// Set the page title to "Add Product" when the component mounts
useEffect(() => {
  document.title = t('addProduct');
}, []);

// Handle image file selection and generate a preview URL
const handleImageChange = (e) => {
  const file = e.target.files[0];
  setImageFile(file);
  if (file) setImagePreview(URL.createObjectURL(file));
};

// Handle product submission: validate inputs, upload image, and insert product into database
const handleAddProduct = async () => {
  if (!name.trim() || !price || !imageFile) {
    toast.error(t('Productnamepriceandimagemustbeentered'));
    return;
  }

  setLoading(true);

  // Get the current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    toast.error(t('Unabletogetcurrentuser'));
    setLoading(false);
    return;
  }

  // Prepare image file name using user ID and timestamp
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  // Upload image to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, imageFile, {
      cacheControl: '3600',
      upsert: true,
      contentType: imageFile.type
    });

  if (uploadError) {
    toast.error(uploadError.message || t('Failedtouploadimage'));
    setLoading(false);
    return;
  }

  // Get public URL of the uploaded image
  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  const imageUrl = publicUrlData?.publicUrl || '';

  // Insert new product into the database
  const { error: insertError } = await supabase
    .from('products')
    .insert({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      image_url: imageUrl,
      owner_id: user.id
    });

  if (insertError) {
    toast.error(insertError.message || t('Failedtoaddproduct'));
  } else {
    toast.success(t('Theproducthasbeenaddedsuccessfully'));
    navigate('/');
    setName('');
    setDescription('');
    setPrice('');
    setImageFile(null);
    setImagePreview(null);
  }

  setLoading(false);
};
  return (
    <Box maxWidth="1000px" mx="auto" mt={5}>
      <Card elevation={5} sx={{ borderRadius: 4, overflow: 'hidden', p: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          {t('ControlPanelAddNewProduct')}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
         {/* Product Data */}
          <Box flex={1} display="flex" flexDirection="column" gap={2}>
            <TextField label={t('productname')} value={name} onChange={(e) => setName(e.target.value)} fullWidth variant="outlined"/>
            <TextField label={t('Description')} value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} variant="outlined"/>
            <TextField label={t('price')} type="number" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth variant="outlined" />
            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon sx={isArabic ? { ml: 2 } : { mr: 0 }} />} sx={{ borderRadius: 3 }} >
             {t('Chooseanimageoftheproduct')}
              <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </Button>

            <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon sx={isArabic ? { ml: 2 } : { mr: 0 }}/>} onClick={handleAddProduct} disabled={loading} sx={{ borderRadius: 3 }} >
              {loading ? <CircularProgress sx={isArabic ? { ml: 2 } : { mr: 0 }} size={24} /> : t('Addproduct')}
            </Button>
          </Box>

          {/* Preview Image */}
          <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          {imagePreview ? (
            <Avatar src={imagePreview} variant="rounded" sx={{ width: 300, height: 300, boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.1)', border: `1px solid ${theme.palette.divider}`}}/>
          ) : (
            <Box width={300} height={300} display="flex" alignItems="center" justifyContent="center" bgcolor={theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'} borderRadius={3} boxShadow={theme.palette.mode === 'dark' ? 2 : 1} border={`1px dashed ${theme.palette.divider}`}>
              <Typography color={theme.palette.text.secondary} textAlign="center" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <AddAPhotoIcon sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
                {t('Thereisnophoto')}
              </Typography>
            </Box>
          )}
          </Box>  
        </Box>
      </Card>
    </Box>
  )
}