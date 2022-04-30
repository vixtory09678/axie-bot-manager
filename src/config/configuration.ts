import { SecretsManager, Credentials } from 'aws-sdk';
const REGION = 'ap-southeast-1';
const SECRET_NAME = 'axie/secret';

async function getSecretManager(secretName: string) {
  const client = new SecretsManager({
    region: REGION,
    credentials: new Credentials(
      process.env.ACCESS_KEY_ID,
      process.env.SECRET_ACCESS_KEY,
    ),
  });

  const secret = await client
    .getSecretValue({ SecretId: secretName })
    .promise();

  const arraySecret = Object.values(JSON.parse(secret.SecretString));
  return arraySecret;
}

export default async () => ({
  secret: await getSecretManager(SECRET_NAME),
});
