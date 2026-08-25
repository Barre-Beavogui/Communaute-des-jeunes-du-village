const MAX_SOURCE_SIZE = 8 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 450_000;
const MAX_DIMENSION = 512;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Cette image ne peut pas être lue."));
    };
    image.src = objectUrl;
  });
}

export async function prepareProfilePhoto(file: File) {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error("Choisissez une image JPG, PNG ou WebP.");
  }
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error("La photo doit peser moins de 8 Mo.");
  }

  const image = await loadImage(file);
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const targetSize = Math.min(sourceSize, MAX_DIMENSION);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("La photo ne peut pas être préparée sur cet appareil.");
  }

  context.fillStyle = "#f4efe6";
  context.fillRect(0, 0, targetSize, targetSize);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    targetSize,
    targetSize,
  );

  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
  }

  throw new Error("Cette photo reste trop volumineuse après compression.");
}
