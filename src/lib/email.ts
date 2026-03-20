function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required email environment variable: ${name}`);
  }

  return value;
}

function parseEmailServerPort() {
  const rawPort = process.env.EMAIL_SERVER_PORT?.trim() ?? "465";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid EMAIL_SERVER_PORT: ${rawPort}`);
  }

  return port;
}

export function getSmtpEmailConfig() {
  const port = parseEmailServerPort();

  return {
    from: getRequiredEnv("EMAIL_FROM"),
    server: {
      host: getRequiredEnv("EMAIL_SERVER_HOST"),
      port,
      secure: port === 465,
      auth: {
        user: getRequiredEnv("EMAIL_SERVER_USER"),
        pass: getRequiredEnv("EMAIL_SERVER_PASSWORD"),
      },
    },
  };
}
