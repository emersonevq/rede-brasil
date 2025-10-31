import { useState, useEffect } from 'react';
import { Image as RNImage } from 'react-native';

type ImageDimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

type UseImageDimensionsReturn = {
  dimensions: ImageDimensions | null;
  isLoading: boolean;
  error: string | null;
};

export function useImageDimensions(
  imageUri: string | undefined,
): UseImageDimensionsReturn {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUri) {
      setDimensions(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    RNImage.getSize(
      imageUri,
      (width, height) => {
        setDimensions({
          width,
          height,
          aspectRatio: width / height,
        });
        setIsLoading(false);
      },
      (err) => {
        setError('Erro ao carregar dimensões da imagem');
        setIsLoading(false);
        // Fallback: usar dimensões padrão 4:3 se falhar
        setDimensions({
          width: 400,
          height: 300,
          aspectRatio: 4 / 3,
        });
      },
    );
  }, [imageUri]);

  return { dimensions, isLoading, error };
}
