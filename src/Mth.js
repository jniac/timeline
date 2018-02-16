export const Mth = {

	enu: {

		*step(start, end, { step, count }) {

			let d = end - start

			if (step)
				count = Math.ceil(d / step)

			for (let i = 0; i <= count; i++)
				yield start + d * i / count

		},

		*for(n) {

			let i = 0

			while(i < n)
				yield i++

		}

	}

}
