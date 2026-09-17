import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', '@types/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            import: importPlugin,
        },
        rules: {
            'no-shadow': 'off',
            'import/prefer-default-export': 'off',
            'no-console': 'off',
            'consistent-return': 'off',
            'func-names': 'off',
            'no-underscore-dangle': ['error', { allow: ['_id'] }],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'import/extensions': [
                'error',
                'ignorePackages',
                { js: 'never', ts: 'never' },
            ],
            'import/no-unresolved': 'off',
            'import/no-extraneous-dependencies': 'off',

            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-shadow': 'off',
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.ts', '.js', '.json'],
                },
            },
        },
    },
    {
        files: ['src/middlewares/error-handler.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
        },
    }
)