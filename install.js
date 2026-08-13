module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    {
      when: "{{exists('app/env') && !exists('app/src/.git')}}",
      method: "fs.rm",
      params: {
        path: "app/env"
      }
    },
    {
      when: "{{exists('app/src') && !exists('app/src/.git')}}",
      method: "fs.rm",
      params: {
        path: "app/src"
      }
    },
    {
      when: "{{!exists('app/src/.git')}}",
      method: "shell.run",
      params: {
        path: "app",
        message: "git clone https://github.com/index-tts/index-tts.git src"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: [
          "uv pip install -r requirements.txt",
          "uv pip install -e ./src --no-deps"
        ]
      }
    },
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          venv: "env",
          path: "app",
          xformers: false
        }
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app/src",
        message: [
          "python -c \"from indextts.utils.model_download import snapshot_download; snapshot_download('IndexTeam/IndexTTS-2.5', local_dir='checkpoints')\"",
          "python -c \"from indextts.utils.model_download import ensure_models_available; ensure_models_available('checkpoints')\"",
          "python -c \"from indextts.utils.examples_downloader import ensure_examples_available; ensure_examples_available()\""
        ]
      }
    },
    {
      method: "notify",
      params: {
        html: "IndexTTS 2.5 installation complete. Click Start to open the Web UI."
      }
    }
  ]
}
