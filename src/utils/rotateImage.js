// Rota una imagen (File/Blob) un múltiplo de 90° usando un canvas y devuelve
// el resultado como Blob. Todo ocurre en el navegador, sin subir la imagen a
// ningún servidor.
export function rotateImageBlob(source, degrees) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(source);
    const img = new Image();

    img.onload = () => {
      const swapDimensions = degrees === 90 || degrees === 270;
      const canvas = document.createElement('canvas');
      canvas.width = swapDimensions ? img.naturalHeight : img.naturalWidth;
      canvas.height = swapDimensions ? img.naturalWidth : img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo rotar la imagen.'))),
        source.type || 'image/jpeg',
        0.92,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen para rotarla.'));
    };

    img.src = objectUrl;
  });
}
