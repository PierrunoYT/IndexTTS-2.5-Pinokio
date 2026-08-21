const path = require("path")
const { spawnSync } = require("child_process")

const mode = process.argv[2]
if (mode !== "apply" && mode !== "reverse") {
  console.error("Usage: node compat.js <apply|reverse>")
  process.exit(1)
}

const source = path.join(__dirname, "app", "src")
const patch = path.join(__dirname, "legacy-gpu.patch")

function gitApply(reverse, checkOnly, quiet = false) {
  const args = ["apply"]
  if (reverse) args.push("--reverse")
  if (checkOnly) args.push("--check")
  args.push(patch)

  const result = spawnSync("git", args, {
    cwd: source,
    stdio: quiet ? "ignore" : "inherit"
  })
  return result.status === 0
}

const reverse = mode === "reverse"
if (gitApply(reverse, true, true)) {
  if (!gitApply(reverse, false)) process.exit(1)
} else if (!gitApply(!reverse, true, true)) {
  console.error("The IndexTTS legacy-GPU patch does not match the installed source.")
  process.exit(1)
}
