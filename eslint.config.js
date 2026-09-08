import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Flat config, deliberately small.
 *
 * <p>There was no linter at all before 2026-09-08, in a plain-JavaScript codebase with no type
 * system — so the two classes of bug a linter is actually good at here went entirely uncaught: a
 * name that does not exist (only `npm run build`'s Rollup resolution caught those, and only for
 * imports) and a `useEffect` whose dependency list does not match what it reads. The second is
 * the expensive one: a stale closure renders correct-looking output from values captured several
 * renders ago, which no test that mounts a component once will see.
 *
 * <p><b>`react-hooks/exhaustive-deps` is an ERROR, not a warning.</b> A warning in a project
 * with no CI gate is a line of text nobody reads. Where the dependency genuinely should not be
 * there — an effect that must run once on mount, a listener that reads a ref on purpose — the
 * call site carries a one-line `eslint-disable-next-line` saying *why*. That is the point: the
 * exception becomes a written decision instead of an absence.
 *
 * <p>`reportUnusedDisableDirectives` is on for the same reason: a disable comment left behind
 * after the code moved is a claim about the code that is no longer true.
 *
 * <p><b>`eslint-plugin-react` is present for exactly one rule: `react/jsx-uses-vars`.</b> None of
 * its stylistic rule set is enabled — JSX correctness beyond hooks is not where this codebase's
 * bugs have been, and that rule set would need a config pass of its own to be anything but noise.
 * But `jsx-uses-vars` is not stylistic: it is what tells `no-unused-vars` that a name referenced
 * in JSX is used. Without it every component imported to be rendered reads as unused, which was
 * 300 false errors here — and a linter whose output is 95% noise is one nobody runs, so the rule
 * that matters (`exhaustive-deps`) would have been lost in it.
 */
export default [
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'error',
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            // The only react/* rule enabled — see the note above. Not a style rule: it is what
            // makes no-unused-vars correct in a JSX file.
            'react/jsx-uses-vars': 'error',
            'react-hooks/exhaustive-deps': 'error',
            // Fast Refresh only works per-module when a file's exports are all components.
            // A warning rather than an error: several files here deliberately export a pure
            // helper beside the component precisely so it can be tested without a DOM
            // (`shouldShowNoMatches`, `watchThreshold`, `shouldRetryQuery`), which is a trade
            // this project has already decided in favour of testability.
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            // `catch {}` with no binding is the idiom used throughout for "this failure is the
            // expected answer"; an unused caught binding is a different thing and stays flagged.
            'no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
        },
    },
    {
        // Node, not a browser: config files and anything that runs under vitest's own runner.
        files: ['*.config.js', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
    {
        files: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
];
