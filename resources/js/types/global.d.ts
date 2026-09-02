import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { PageProps as AppPageProps } from './';

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps, AppPageProps {}
}

// custom event reference: https://github.com/sveltejs/svelte/issues/9858
