import path from 'path'

export default {
	input: './src/timeline.js',
	plugins: [
		
	],
	external: [path.resolve('./src/event.js')],
	// sourceMap: true,
	output: [
		// {
		// 	format: 'umd',
		// 	name: 'timeline',
		// 	file: 'build/timeline.bundle.js',
		// 	indent: '\t'
		// },
		{
			format: 'es',
			file: 'build/timeline.module.js',
			banner: `/* exprimental stuff from https://github.com/jniac/timeline */\n`,
			indent: '\t'
		}
	]
}
