import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import filesize from 'rollup-plugin-filesize'
import { fastDimension } from 'svelte-fast-dimension'
import modify from 'rollup-plugin-modify'

const production = !process.env.ROLLUP_WATCH

const terserOptions = {
	format: {
		ecma: 2015,
	},
	compress: {
		booleans_as_integers: true,
		pure_getters: true,
		drop_console: true,
		unsafe: true,
		hoist_vars: true,
		unsafe_arrows: true,
		unsafe_comps: true,
		unsafe_Function: true,
		unsafe_math: true,
		unsafe_symbols: true,
		unsafe_methods: true,
		unsafe_proto: true,
		unsafe_regexp: true,
		unsafe_undefined: true,
		ecma: 2015,
		passes: 2,
	},
}

/*
rm unneeded svelte stuff for vanilla scripts (hacky but saves a few bytes)
need to re-test / modify if svelte is updated
*/
const tagsRegex1 = /(>)[\s]*([<{])/g
const tagsRegex2 = /({[/:][a-z]+})[\s]*([<{])/g
const tagsRegex3 = /({[#:][a-z]+ .+?})[\s]*([<{])/g
const tagsRegex4 = /([>}])[\s]+(<|{[/#:][a-z][^}]*})/g
const tagsReplace = '$1$2'
const findReplace = {
	find: /^\s*validate_store.+$|throw.+interpolate.+$/gm,
	replace: '',
}
const findReplace2 = {
	find: 'if (options.hydrate)',
	replace: 'if (false)',
}
const findReplace3 = {
	find: /if \(type === 'object'\) {(.|\n)+if \(type === 'number'\)/gm,
	replace: `if (type === 'number')`,
}
const findReplace4 = {
	find: `: blank_object()`,
	replace: `: {}`,
}
const findReplace5 = {
	find: `typeof window !== 'undefined'`,
	replace: `true`,
}
const findReplace6 = {
	find: /^.+globals \=[^;]+;/gm,
	replace: `const globals = window;`,
}
const findReplace7 = {
	find: /get_root_for_style\(node\),/g,
	replace: 'document,',
}

let config = [
	{
		input: 'src/demo/demo.js',
		output: {
			format: 'iife',
			file: 'public/demo.js',
		},
		plugins: [
			commonjs(),
			svelte({
				preprocess: [
					{
						markup: ({ content }) => {
							const code = content
								.replace(tagsRegex1, tagsReplace)
								.replace(tagsRegex2, tagsReplace)
								.replace(tagsRegex3, tagsReplace)
								.replace(tagsRegex4, tagsReplace)
							return { code }
						},
					},
					fastDimension(),
				],
				compilerOptions: {
					dev: !production,
				},
			}),
			resolve({ browser: true }),
			modify(findReplace),
			modify(findReplace2),
			modify(findReplace3),
			modify(findReplace4),
			modify(findReplace5),
			modify(findReplace6),
			modify(findReplace7),
			production && terser(terserOptions),
		],
	},
]

if (production) {
	config.push({
		input: 'src/bigger-picture.js',
		output: [
			{
				format: 'iife',
				name: 'BiggerPicture',
				file: 'dist/bigger-picture.min.js',
				strict: false,
			},
			{
				format: 'umd',
				name: 'BiggerPicture',
				file: 'dist/bigger-picture.umd.js',
				strict: false,
			},
			{
				format: 'es',
				file: 'dist/bigger-picture.mjs',
			},
		],
		plugins: [
			svelte({
				preprocess: [
					{
						markup: ({ content }) => {
							const code = content
								.replace(tagsRegex1, tagsReplace)
								.replace(tagsRegex2, tagsReplace)
								.replace(tagsRegex3, tagsReplace)
								.replace(tagsRegex4, tagsReplace)
							return { code }
						},
					},
					fastDimension(),
				],
			}),
			resolve({ browser: true }),
			modify(findReplace),
			modify(findReplace2),
			modify(findReplace3),
			modify(findReplace4),
			modify(findReplace5),
			modify(findReplace6),
			modify(findReplace7),
			terser(terserOptions),
			filesize({
				showMinifiedSize: !production,
			}),
		],
	})
}

export default config
