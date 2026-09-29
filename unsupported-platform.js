// Fails the install with an explicit reason instead of letting an
// uninstallable platform surface later as a mystery ImportError.
//
// Usage: node unsupported-platform.js "<reason>"
const reason = process.argv[2] || "This platform is not supported."

console.error("")
console.error("=".repeat(72))
// Pinokio ignores exit codes and only halts on output matching /error:/i, so
// without the "Error:" prefix the install carried on to download the models.
console.error("Error: IndexTTS 2.5 cannot be installed on this platform.")
console.error("")
console.error(reason)
console.error("=".repeat(72))
console.error("")
process.exit(1)
