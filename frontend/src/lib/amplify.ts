import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      }
    },
    Storage: {
      S3: {
        bucket: import.meta.env.VITE_S3_BUCKET,
        region: import.meta.env.VITE_AWS_REGION,
      }
    }
  });
}
