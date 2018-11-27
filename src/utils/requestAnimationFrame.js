
export default typeof window !== 'undefined' ? window.requestAnimationFrame : callback => setTimeout(callback, 1000/60)
