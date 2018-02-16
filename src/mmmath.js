export const mmmath = {

	enu: {

		*step(start, end, { step, count }) {

			let d = end - start

			if (step)
				count = Math.ceil(d / step)

			for (let i = 0; i <= count; i++)
				yield start + d * i / count

		}

	}

}
