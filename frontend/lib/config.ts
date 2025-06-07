interface Config {
  apiUrl: string;
  baseUrl: string;
}

const config: Config = {
  // eslint-disable-next-line no-undef
  apiUrl: process.env.REACT_APP_API_URL || "https://localhost/api/auth",

  // eslint-disable-next-line no-undef
  baseUrl: process.env.REACT_APP_BASE_URL || "https://localhost",
};

export default config;
