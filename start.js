module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app/src",
        env: {
          GRADIO_ANALYTICS_ENABLED: "False"
        },
        message: [
          "python webui.py --host 127.0.0.1 --port {{port}} --model_dir checkpoints --version 2.5 --fp16"
        ],
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    },
    {
      method: "notify",
      params: {
        html: "IndexTTS 2.5 is running. Click Open Web UI to synthesize speech."
      }
    }
  ]
}
