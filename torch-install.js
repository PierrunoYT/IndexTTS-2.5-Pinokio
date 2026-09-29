const { spawnSync } = require("child_process")

// Pinokio ignores exit codes and only halts on output matching /error:/i, so
// every failure must print an "Error:" line or the install carries on to the
// requirements and model downloads without a working torch.
function fail(message, status = 1) {
  console.error(`Error: ${message}`)
  process.exit(status || 1)
}

const capabilityResult = spawnSync(
  "nvidia-smi",
  ["--query-gpu=compute_cap", "--format=csv,noheader"],
  { encoding: "utf8" }
)
const capability = capabilityResult.stdout?.trim().split(/\r?\n/, 1)[0]
const match = /^(\d+)\.(\d+)$/.exec(capability || "")

if (capabilityResult.status !== 0 || !match) {
  fail("Unable to detect the NVIDIA GPU compute capability. Update the NVIDIA driver and retry.")
}

const major = Number(match[1])
const minor = Number(match[2])
const legacyGpu = major < 7 || (major === 7 && minor < 5)
const cuda = legacyGpu ? "cu126" : "cu128"
const packages = [
  "torch==2.8.0",
  "torchvision==0.23.0",
  "torchaudio==2.8.0"
]
// No --no-deps here: the verify step below imports torch before
// app/requirements.txt is installed, and torch needs filelock,
// typing-extensions, sympy, networkx, jinja2, and fsspec to import at all.
const args = [
  "pip", "install", ...packages,
  "--index-url", `https://download.pytorch.org/whl/${cuda}`,
  "--force-reinstall"
]

console.log(`Installing PyTorch ${cuda} for CUDA compute capability ${capability}`)
const install = spawnSync("uv", args, { stdio: "inherit" })
if (install.status !== 0) fail("Installing PyTorch failed.", install.status)

const verify = spawnSync(
  "python",
  [
    "-c",
    "import torch; cap=torch.cuda.get_device_capability(); arch=f'sm_{cap[0]}{cap[1]}'; assert arch in torch.cuda.get_arch_list(), f'{arch} is missing from this PyTorch build'; print(f'PyTorch {torch.__version__}, CUDA {torch.version.cuda}, {torch.cuda.get_device_name(0)} ({arch})')"
  ],
  { stdio: "inherit" }
)
if (verify.status !== 0) fail("The installed PyTorch build cannot use this GPU.", verify.status)
