interface Config {
  authUrl: string;
  baseUrl: string;
  storageUrl: string;
}

const config: Config = {
  // eslint-disable-next-line no-undef
  authUrl: process.env.REACT_APP_API_URL || "http://localhost/api/auth",

  // eslint-disable-next-line no-undef
  baseUrl: process.env.REACT_APP_BASE_URL || "http://localhost",

  // eslint-disable-next-line no-undef
  storageUrl:
    process.env.REACT_APP_STORAGE_URL || "http://localhost/api/storage",
};

export default config;
