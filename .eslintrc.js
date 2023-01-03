module.exports = {
    'env': {
        'commonjs': true,
        'es2021': true,
        'node': true,
        'jest/globals': true
    },
    'plugins': ['jest'],
    'extends': ['eslint:recommended'],
    'root': true,
    'parserOptions': {
        'ecmaVersion': 'latest'
    },
    overrides: [
        {
            files: ['src/*.ts'],
            plugins: [
            '@typescript-eslint',
            ],
            extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: ['./tsconfig.json'],
            },
            'rules': {
                '@typescript-eslint/no-namespace': 'off',
                '@typescript-eslint/no-empty-interface': 'off'
            },
        },
    ],
}
