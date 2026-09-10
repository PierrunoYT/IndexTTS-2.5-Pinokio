// Fails the install with an explicit reason instead of letting an
// uninstallable platform surface later as a mystery ImportError.
//
// Usage: node unsupported-platform.js "<reason>"
const reason = process.argv[2] || "This platform is not supported."

console.error("")
console.error("=".repeat(72))
console.error("IndexTTS 2.5 cannot be installed on this platform.")
console.error("")
console.error(reason)
console.error("=".repeat(72))
console.error("")
process.exit(1)
