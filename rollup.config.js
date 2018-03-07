import path from 'path'

function date() {

	let date = new Date()

	const f = n => n.toFixed().padStart(2, '0')

	return date.getFullYear() + '-' + f(1 + date.getMonth()) + '-' + f(date.getDate())

}

function banner() {
	
	return `

/* ${date()} */
/* exprimental stuff from https://github.com/jniac/timeline */\n

`.trim()

}

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
			banner: banner(),
			indent: '\t'
		}
	]
}
