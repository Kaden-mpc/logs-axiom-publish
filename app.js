const pmx = require('pmx');
const tail = require('tail').Tail;
const fs = require('fs');
const { Axiom } = require('@axiomhq/js');

const DEFAULT_AXIOM_TOKEN = 'YOUR_AXIOM_TOKEN';
const DEFAULT_AXIOM_ORG = 'YOUR_AXIOM_ORG';
const DEFAULT_AXIOM_DATASET = 'YOUR_AXIOM_DATASET';
const DEFAULT_OUT = 'path/to/your/log/file.log';
const DEFAULT_ERR = 'path/to/your/error/log/file.log';
const DEFAULT_INTERVAL = 10000;

try {
  pmx.initModule({}, function (err, conf) {
    if (err) {
      return console.error(err);
    }

    // Get the name of the module
    const moduleName = pmx.getConf().module_name;

    const setCmd = (cmd, placeholder) => `pm2 set ${moduleName}:${cmd} ${placeholder}`;

    const token = conf.axiom_token || DEFAULT_AXIOM_TOKEN;
    const org = conf.axiom_org || DEFAULT_AXIOM_ORG;
    const dataset = conf.axiom_dataset || DEFAULT_AXIOM_DATASET;
    const outLog = conf.out || DEFAULT_OUT;
    const errLog = conf.err || DEFAULT_ERR;
    const interval = conf.interval || DEFAULT_INTERVAL;

    console.log(`Axiom token: ${token}`);
    console.log(`Axiom org: ${org}`);
    console.log(`Axiom dataset: ${dataset}`);
    console.log(`Log file: ${outLog}`);
    console.log(`Error log file: ${errLog}`);
    console.log(`Interval: ${interval}`);

    if (token === DEFAULT_AXIOM_TOKEN) {
      throw new Error(
        `Please set your Axiom token in the PM2 configuration. Do this with: ${setCmd(
          'axiom_token',
          '<YOUR AXIOM TOKEN>'
        )}`
      );
    }

    if (org === DEFAULT_AXIOM_ORG) {
      throw new Error(
        `Please set your Axiom organization in the PM2 configuration. Do this with: ${setCmd(
          'axiom_org',
          '<YOUR AXIOM ORG>'
        )}`
      );
    }

    if (dataset === DEFAULT_AXIOM_DATASET) {
      throw new Error(
        `Please set your Axiom dataset in the PM2 configuration. Do this with: ${setCmd(
          'axiom_dataset',
          '<YOUR AXIOM DATASET>'
        )}`
      );
    }

    if (outLog === DEFAULT_OUT) {
      throw new Error(
        `Please set the path to your log file in the PM2 configuration. Do this with: ${setCmd(
          'out',
          '<PATH TO LOG FILE>'
        )}`
      );
    }

    if (errLog === DEFAULT_ERR) {
      throw new Error(
        `Please set the path to your error log file in the PM2 configuration. Do this with: ${setCmd(
          'err',
          '<PATH TO ERROR LOG FILE>'
        )}`
      );
    }

    if (isNaN(interval)) {
      throw new Error(
        `Please set the interval in the PM2 configuration. Do this with: ${setCmd(
          'interval',
          '<INTERVAL>'
        )}`
      );
    }

    // Validate paths exist
    if (!fs.existsSync(outLog)) {
      throw new Error(`Log file does not exist. Change the path with: ${setCmd('out', '<PATH>')}`);
    }

    if (!fs.existsSync(errLog)) {
      throw new Error(
        `Error log file does not exist. Change the path with: ${setCmd('err', '<PATH>')}`
      );
    }

    const axiomClient = new Axiom({
      token,
      orgId: org,
    });

    const outTail = new tail(outLog, {
      logger: console,
      useWatchFile: true,
    });
    const errTail = new tail(errLog, {
      logger: console,
      useWatchFile: true,
    });

    // Start watching the log files

    outTail.on('line', (data) => {
      const timeOfChange = new Date().toISOString();
      const log = {
        _time: timeOfChange,
        type: 'log',
        data: { log: data, error: false },
      };
      axiomClient.ingest(dataset, log);
    });
    outTail.watch();

    errTail.on('line', (data) => {
      const timeOfChange = new Date().toISOString();
      const log = {
        _time: timeOfChange,
        type: 'log',
        data: { log: data, error: true },
      };
      axiomClient.ingest(dataset, log);
    });
    errTail.watch();

    // Send logs to Axiom
    setInterval(async () => {
      try {
        await axiomClient.flush();
      } catch (e) {
        console.error(e);
      }
    }, interval);
  });
} catch (e) {
  console.log(e);
}
