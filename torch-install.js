const { spawnSync } = require("child_process")

const capabilityResult = spawnSync(
  "nvidia-smi",
  ["--query-gpu=compute_cap", "--format=csv,noheader"],
  { encoding: "utf8" }
)
const capability = capabilityResult.stdout?.trim().split(/\r?\n/, 1)[0]
const match = /^(\d+)\.(\d+)$/.exec(capability || "")

if (capabilityResult.status !== 0 || !match) {
  console.error("Unable to detect the NVIDIA GPU compute capability. Update the NVIDIA driver and retry.")
  process.exit(1)
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
if (install.status !== 0) process.exit(install.status || 1)

const verify = spawnSync(
  "python",
  [
    "-c",
    "import torch; cap=torch.cuda.get_device_capability(); arch=f'sm_{cap[0]}{cap[1]}'; assert arch in torch.cuda.get_arch_list(), f'{arch} is missing from this PyTorch build'; print(f'PyTorch {torch.__version__}, CUDA {torch.version.cuda}, {torch.cuda.get_device_name(0)} ({arch})')"
  ],
  { stdio: "inherit" }
)
if (verify.status !== 0) process.exit(verify.status || 1)
