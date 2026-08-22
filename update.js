module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git pull"
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app/src",
        message: "node ../../compat.js reverse"
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app/src",
        message: "git pull"
      }
    },
    {
      method: "script.start",
      params: {
        uri: "install.js"
      }
    }
  ]
}
