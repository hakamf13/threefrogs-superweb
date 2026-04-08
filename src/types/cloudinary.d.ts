type CloudinaryUploadWidgetResult = {
  event?: string;
  info?: {
    secure_url?: string;
    original_filename?: string;
    bytes?: number;
    format?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (
          error: unknown,
          result: CloudinaryUploadWidgetResult
        ) => void
      ) => {
        open: () => void;
      };
    };
  }
}

export {};