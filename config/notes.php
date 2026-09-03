<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Notes Path
    |--------------------------------------------------------------------------
    |
    | The directory that holds all note categories. Each sub-directory is a
    | category, and each markdown file inside it is a note.
    |
    */

    'path' => env('NOTES_PATH') ? base_path(env('NOTES_PATH')) : resource_path('notes'),

    /*
    |--------------------------------------------------------------------------
    | Category Display Names
    |--------------------------------------------------------------------------
    |
    | Folder names are converted to display names with Str::headline() by
    | default. List the exceptions (acronyms, brand names) here.
    |
    */

    'display_names' => [
        'ai' => 'AI',
        'argocd' => 'Argo CD',
        'aws' => 'AWS',
        'google-cloud-platform' => 'Google Cloud Platform',
        'k8s' => 'K8s',
        'php' => 'PHP',
        'tailwind-css' => 'Tailwind CSS',
        'typescript' => 'TypeScript',
    ],

];
