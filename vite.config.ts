import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import inertia from "@inertiajs/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/app.ts"],
            refresh: true,
        }),
        svelte(),
        inertia(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./resources/js"),
        },
    },
});
