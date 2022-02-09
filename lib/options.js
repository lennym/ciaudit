const { pick } = require('lodash');

const levels = require('./levels');
const loadIgnoreFile = require('./ignorefile');

const normaliseOptions = async options => {
  const defaults = {
    level: 'low',
    ignorefile: './.auditignore',
    production: undefined,
    ignore: []
  };

  const settings = {
    ...defaults,
    ...options
  };

  // handle --moderate, --high, --critical
  levels.forEach(level => {
    if (!options.level && options[level]) {
      settings.level = level;
    }
  });

  // support `--production` flag passed to npm script
  if (settings.production === undefined) {
    settings.production = process.env.NODE_ENV === 'production';
  }

  settings.ignore = await loadIgnoreFile(settings.ignorefile);
  return pick(settings, Object.keys(defaults));
};

module.exports = normaliseOptions;
