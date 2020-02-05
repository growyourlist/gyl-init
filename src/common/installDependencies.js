const path = require("path");
const exec = require("util").promisify(require("child_process").exec);

const Logger = require("../Logger");

/** Runs yarn install in the given directory. */
const installDependencies = async (projectDir, opts = {}) => {
  const name = path.parse(projectDir).name;
  Logger.info(`Installing dependencies for ${name}`);
  let {
    stderr
  } = await exec("yarn install --non-interactive --silent --ignore-optional", {
    cwd: projectDir
  });
  if (stderr && stderr.trim()) {
    const errorLines = stderr
      .split("\n")
      .map(line => line.toLowerCase().trim())
      .filter(line => !!line);
    errorLines.forEach(line => {
      // Ignore warnings about aws-sdk missing as a peer dependency if required.
      if (
        !(
          opts.ignoreMissingAWSSDKPeerDependencyWarning &&
          line.indexOf("warning") >= 0 &&
          line.indexOf("peer dependency") >= 0 &&
          line.indexOf("aws-sdk") >= 0
        )
      ) {
        throw new Error(
          `Error installing dependencies for "${name}": ${stderr}`
        );
      }
    });
  }
};

module.exports = installDependencies;
