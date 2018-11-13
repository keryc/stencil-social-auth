import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'stencil-social-auth',
  outputTargets:[
    {
      type: 'dist'
    },
    {
      type: 'www',
      serviceWorker: null
    }
  ]
};
