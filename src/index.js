const axios = require('axios').default;
const config = require('../config.json');
const chalk = require('chalk');
const { join } = require('node:path');
const { stat } = require('node:fs/promises');
const { execSync } = require('node:child_process');

(async () => {
  /** @type {Repository[]} */
  const repositories = (
    await axios.get(
      `https://api.github.com/orgs/${config.organization}/repos`,
      {
        auth: {
          username: config.username,
          password: config.personalAccessToken,
        },
      }
    )
  ).data;

  console.log(
    chalk.bgBlue(' INFO '),
    `Found ${chalk.bold(repositories.length)} repositories`
  );

  for (const repository of repositories) {
    console.log('\n');
    if (config.excludedRepositories.includes(repository.name)) return;
    console.log(chalk.bgRedBright(' REPO '), `Processing ${repository.name}`);

    const backupPath = join(config.backupFolder, repository.name);

    if (!(await stat(backupPath).catch(() => false))) {
      // Never backed up before
      console.log(
        chalk.bgGreen(' BACKUP '),
        `First time backup'ing ${repository.name} (backupFolder=${backupPath})`
      );
      execSync(`git clone ${repository.html_url}`, {
        cwd: config.backupFolder,
      });
      console.log(
        chalk.bgGreen(' BACKUP '),
        `Successfully backed up ${repository.name}`
      );
    } else {
      // Already backed up, fetching changes
      console.log(
        chalk.bgGreenBright(' BACKUP '),
        `Fetching changes for ${repository.name}`
      );
      execSync(`git fetch --all`, {
        cwd: backupPath,
      });
      console.log(
        chalk.bgGreenBright(' BACKUP '),
        `Successfully fetched changes for ${repository.name}`
      );
    }
  }

  console.log('\n');
  console.log(
    chalk.bgBlue(' INFO '),
    `Backed up ${chalk.bold(repositories.length)} repositories`
  );
})();

/**
 * @typedef Repository A GitHub repository
 * @property {string} name Name of the repository
 * @property {string} html_url URL to the repository
 * @property {boolean} private Whether the repository is private or not
 */
