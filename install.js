// Upstream revision this launcher is tested against. legacy-gpu.patch carries
// fixed context lines, so tracking main unpinned means the next upstream commit
// touching IndexTTS2.__init__ or build_tts breaks every fresh install. Bump this
// and re-verify the patch together, in one commit.
const UPSTREAM_REV = "ee40fa7d6c6b8a2c7f06105f9f1e65775b74868c"

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
      // Fetch only when the pinned commit is missing, so Reinstall and Update
      // work offline, and fetch it by hash so a rewritten upstream main cannot
      // leave it unreachable. --force discards the compatibility patch so the
      // checkout can move, and leaves untracked files -- checkpoints/ above
      // all -- alone.
      method: "shell.run",
      params: {
        path: "app/src",
        message: [
          `git cat-file -e ${UPSTREAM_REV} || git fetch origin ${UPSTREAM_REV}`,
          `git checkout --force ${UPSTREAM_REV}`
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app/src",
        message: "node ../../compat.js apply"
      }
    },
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          venv: "env",
          path: "app"
        }
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
