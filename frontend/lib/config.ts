interface Config {
  authUrl: string;
  baseUrl: string;
  storageUrl: string;
}

console.log(process.env.NEXT_PUBLIC_API_URL);

const config: Config = {
  authUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/auth",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost",
  storageUrl:
    process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost/api/storage",
};

export default config;
