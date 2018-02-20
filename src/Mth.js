export const Mth = {

	clamp(x, min = 0, max = 1) {

		return x < min ? min : x > max ? max : x

	},

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
