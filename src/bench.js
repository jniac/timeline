export function bench(...functions) {

	const now = typeof performance === 'object' 
		? performance.now.bind(performance)
		: Date.now.bind(Date)

	console.log(`\ntest bench of ${functions.length} functions`)
	
	let { duration, costPrecision } = bench
	
	let t, dt, count, cost

	t = now()
	count = 0

	while(now() - t < duration)
		count++

	dt = now() - t
	cost = dt / count
	console.log(`-- dt: ${dt.toFixed(1)}ms count: ${count}op cost: ${cost.toFixed(costPrecision)}ms`)

	let refCount = count

	for (let [i, f] of functions.entries()) {

		t = now()
		count = 0

		while(now() - t < duration) {

			f()
			count++

		}

		dt = now() - t
		cost = dt / count

		let relCost = refCount / count

		console.log(`#${i} dt: ${dt.toFixed(1)}ms count: ${count}op cost: ${cost.toFixed(costPrecision)}ms x${relCost.toFixed(3)} slower`)

	}
	
}

Object.assign(bench, {

	duration: 500, 		// ms
	costPrecision: 6, 	// digit in output
	
})

export default bench
