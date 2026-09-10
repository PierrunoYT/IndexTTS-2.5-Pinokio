const path = require("path")
const { spawnSync } = require("child_process")

const mode = process.argv[2]
if (mode !== "apply" && mode !== "reverse") {
  console.error("Usage: node compat.js <apply|reverse>")
  process.exit(1)
}

const source = path.join(__dirname, "app", "src")
const patch = path.join(__dirname, "legacy-gpu.patch")
const patchedFiles = ["indextts/infer_v2_5.py", "webui.py"]

function restore(quiet = false) {
  const result = spawnSync("git", ["checkout", "HEAD", "--", ...patchedFiles], {
    cwd: source,
    stdio: quiet ? "ignore" : "inherit"
  })
  return result.status === 0
}

if (mode === "reverse") {
  process.exit(restore() ? 0 : 1)
}

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

if (gitApply(false, true, true)) {
  // Pristine source: apply the patch.
  if (!gitApply(false, false)) process.exit(1)
} else if (gitApply(true, true, true)) {
  // Already fully patched: nothing to do.
} else {
  // Neither state matches, so the patched files are in a partial or hand-edited
  // state. Discard the local changes and retry once -- without this, Install and
  // Reinstall both dead-end here and only Reset (which also deletes the
  // multi-GB checkpoints) can recover.
  console.log("The patched IndexTTS files are in an unexpected state; restoring them and retrying.")
  if (!restore()) {
    console.error("Unable to restore the IndexTTS source files to their checked-out state.")
    process.exit(1)
  }
  if (!gitApply(false, true, true)) {
    console.error("The IndexTTS legacy-GPU patch does not match the installed source.")
    process.exit(1)
  }
  if (!gitApply(false, false)) process.exit(1)
}
