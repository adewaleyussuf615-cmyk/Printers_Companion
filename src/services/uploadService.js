import { supabase } from '../supabaseClient';

/**
 * Upload a product image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {number} productId - The product ID
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadProductImage = async (file, productId) => {
  if (!file) return null;
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}-${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrl;
};

/**
 * Delete a product image from storage
 * @param {string} imageUrl - The image URL to delete
 */
export const deleteProductImage = async (imageUrl) => {
  if (!imageUrl) return;
  
  // Extract path from URL
  const path = imageUrl.split('/').pop();
  const filePath = `products/${path}`;

  const { error } = await supabase.storage
    .from('product-images')
    .remove([filePath]);

  if (error) throw error;
};

/**
 * Compress image before upload
 * @param {File} file - Original image file
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const maxWidth = 800;
        const maxHeight = 800;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
