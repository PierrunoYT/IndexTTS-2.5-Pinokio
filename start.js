module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "../env",
        path: "app/src",
        env: {
          GRADIO_ANALYTICS_ENABLED: "False",
          // Apple Silicon only (ignored elsewhere). The MPS caching allocator
          // keeps every freed block in its pool until usage passes the low
          // watermark, which defaults to the full recommended working set --
          // on a 128 GB Mac that is ~96 GB, so full-precision inference grows
          // until the machine runs out of memory and stays there until exit.
          // Recycling at 30% keeps the pool bounded.
          PYTORCH_MPS_LOW_WATERMARK_RATIO: "0.3",
          // Let ops without a Metal kernel run on CPU instead of aborting.
          PYTORCH_ENABLE_MPS_FALLBACK: "1"
        },
        message: [
          // --fp16 only reaches a real code path on CUDA; on MPS and CPU it is
          // rejected during setup, so leave it off outside NVIDIA.
          "python webui.py --host 127.0.0.1 --port {{port}} --model_dir checkpoints --version 2.5{{gpu === 'nvidia' ? ' --fp16' : ''}}"
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
