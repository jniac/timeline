
export default typeof window !== 'undefined' ? window.addEventListener.bind(window) : () => {}
