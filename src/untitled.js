// class ExtendableProxy {
//     constructor() {
//         return new Proxy(this, {
//             set: (object, key, value, proxy) => {
//                 object[key] = value;
//                 console.log('PROXY SET');
//                 return true;
//             }
//         });
//     }
// }

// class ChildProxyClass extends ExtendableProxy {}

// let myProxy = new ChildProxyClass();

// // Should set myProxy.a to 3 and print 'PROXY SET' to the console:
// myProxy.a = 3;

	class Point {

		constructor(x, y) {
			this.x = x
			this.y = y
		}

		getLength() {
			let { x, y } = this
			return Math.sqrt(x * x + y * y)
		}

		get length() {
			return this.getLength()
		}

	}

	class ObservedPoint extends Point {

		constructor(x, y) {

			super(x, y)

			return new Proxy(this, {
				set(object, key, value, proxy) {
					if (object[key] === value)
						return
					console.log('Point is modified')
					object[key] = value
				}
			})
		}
	}

	p = new ObservedPoint(3, 4)

	console.log(p.length)

	p.x = 10

	console.log(p.length)




