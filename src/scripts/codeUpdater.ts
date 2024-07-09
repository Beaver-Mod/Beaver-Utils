import { scriptMessage, errorMessage, otherMessage } from '../functions/logger';
import { exec } from 'child_process';
import { schedule } from 'node-cron';

schedule('0 */6 * * *', function () {
  scriptMessage('Checking for Code updates.');
  exec('git pull', (error, stdout, stderr) => {
    if (error) {
      errorMessage(`Git pull error: ${error}`);
      return;
    }
    if (stdout === 'Already up to date.\n') {
      return scriptMessage('Code is already up to date.');
    }
    if (stderr) {
      otherMessage(`Git pull stderr: ${stderr}`);
    }
    const columns = process.stdout.columns;
    const warning = 'IMPORTANT!';
    const message2 = 'Bot has updated, please restart the bot to apply changes!';
    const padding = ' '.repeat(Math.floor((columns - warning.length) / 2));
    const padding2 = ' '.repeat(Math.floor((columns - message2.length) / 2));
    console.log(padding + warning + padding + '\n' + padding2 + message2 + padding2);
  });
});
