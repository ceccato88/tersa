import { handleError } from './error/handle';

type Downloadable = {
  url: string;
  type: string;
};

export const download = (
  data: Downloadable | undefined,
  id: string,
  defaultExtension: string
) => {
  if (!data) {
    handleError('Error downloading file', 'No data to download.');
    return;
  }

  const link = document.createElement('a');
  // Extrair extensão do tipo MIME ou usar padrão
  let extension = defaultExtension;
  if (data.type && data.type.includes('/')) {
    const extractedExtension = data.type.split('/').at(-1);
    if (extractedExtension && extractedExtension !== 'image' && extractedExtension !== 'video') {
      extension = extractedExtension;
    }
  }
  const filename = `tersa-${id}.${extension}`;

  // Create a blob URL from the data URL
  fetch(data.url)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    })
    .catch((error) => {
      handleError('Error downloading file', error.message);
    });
};
