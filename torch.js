// Upstream pins torch==2.8.* (app/src/pyproject.toml), so every branch below
// installs the matching 2.8.0 / 0.23.0 / 2.8.0 triple. Do not pass --no-deps:
// torch needs filelock, typing-extensions, sympy, networkx, jinja2, and fsspec
// at import time, and nothing in app/requirements.txt supplies sympy or
// networkx.
const TORCH = "torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0"

const venv = "{{args && args.venv ? args.venv : null}}"
const path = "{{args && args.path ? args.path : '.'}}"

module.exports = {
  run: [
    // windows nvidia
    {
      "when": "{{gpu === 'nvidia' && platform === 'win32'}}",
      "method": "shell.run",
      "params": {
        "venv": venv,
        "path": path,
        "message": "node ../torch-install.js"
      }
    },
    // windows without an nvidia gpu (including amd)
    //
    // AMD goes through the CPU wheels on purpose. torch-directml pins an old
    // torch and numpy<2, both of which app/requirements.txt overwrites moments
    // later, and IndexTTS2 only ever selects cuda/xpu/mps/cpu -- so DirectML
    // would fall back to the CPU anyway, just from a broken environment.
    {
      "when": "{{platform === 'win32' && gpu !== 'nvidia'}}",
      "method": "shell.run",
      "params": {
        "venv": venv,
        "path": path,
        "message": `uv pip install ${TORCH} --index-url https://download.pytorch.org/whl/cpu --force-reinstall`
      }
    },
    // arm64 mac
    {
      "when": "{{platform === 'darwin' && arch === 'arm64'}}",
      "method": "shell.run",
      "params": {
        "venv": venv,
        "path": path,
        "message": `uv pip install ${TORCH} --force-reinstall`
      }
    },
    // linux nvidia
    {
      "when": "{{gpu === 'nvidia' && platform === 'linux'}}",
      "method": "shell.run",
      "params": {
        "venv": venv,
        "path": path,
        "message": "node ../torch-install.js"
      }
    },
    // linux rocm (amd)
    {
      "when": "{{platform === 'linux' && gpu === 'amd'}}",
      "method": "shell.run",
      "params": {
        "venv": venv,
        "path": path,
        "message": `uv pip install ${TORCH} --index-url https://download.pytorch.org/whl/rocm6.3 --force-reinstall`
      }
    },
    // linux cpu
    {
      "when": "{{platform === 'linux' && (gpu !== 'amd' && gpu !=='nvidia')}}",
      "method": "shell.run",
      "params": {
        "venv": venv,
        "path": path,
        "message": `uv pip install ${TORCH} --index-url https://download.pytorch.org/whl/cpu --force-reinstall`
      }
    }
  ]
}
