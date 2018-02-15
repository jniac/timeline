export default {
	input: 'src/timeline.js',
	plugins: [
		
	],
	external: ['src/event.js'],
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
			indent: '\t'
		}
	]
}
