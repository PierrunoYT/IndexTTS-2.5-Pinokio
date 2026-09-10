module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git pull"
      }
    },
    {
      // install.js owns the upstream side: it clones when needed, fetches, and
      // hard-checks out the pinned revision. Doing it here as well meant Update
      // ran git against app/src unguarded, so a half-installed app failed here
      // instead of falling through to a reinstall.
      method: "script.start",
      params: {
        uri: "install.js"
      }
    }
  ]
}
