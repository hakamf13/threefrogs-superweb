declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: any) => void
      ) => {
        open: () => void;
      };
    };
  }
}

export {};