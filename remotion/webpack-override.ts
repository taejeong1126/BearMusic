import { WebpackOverrideFn } from '@remotion/bundler';
import { enableTailwind } from '@remotion/tailwind-v4';

export const webpackOverride: WebpackOverrideFn = (currentConfiguration) => {
    return enableTailwind(currentConfiguration);
};
