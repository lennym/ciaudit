const Arborist = require('@npmcli/arborist');
const { flatten } = require('lodash');
const minimatch = require('minimatch');
const { spawn } = require('child_process');
const normaliseOptions = require('./lib/options');
const levels = require('./lib/levels');

const runLocalAudit = async settings => {

  const result = [];
  const args = ['audit', '--json'];

  if (settings.production) {
    args.push('--production');
  }

  return new Promise(resolve, reject => {
    const proc = spawn('npm', args);
    proc.stdout.on('data', chunk => result.push(chunk));
    proc.on('error', reject);
    proc.on('end', () => {
      const json = Buffer.concat(result).toString();
      resolve(JSON.parse(json));
    });
  });
};

const runAudit = async settings => {
  if (settings.local) {
    return runLocalAudit(settings);
  }
  const omit = [];
  if (settings.production) {
    omit.push('dev');
  }
  const arb = new Arborist({ path: process.cwd(), omit });
  const result = await arb.audit();
  return result.toJSON();
};

const ignoreMatch = (item, { name = '', source = '', path = '' }) => {
  if (item.includes('&&')) {
    return item
      .split('&&')
      .map(s => s.trim())
      .every(part => ignoreMatch(part, { name, source, path }));
  }
  if (name === item) {
    return true;
  }
  if (source.toString() === item) {
    return true;
  }
  return minimatch(path, item);
};

const isIgnored = (vuln, settings) => {
  const baseLevel = levels.indexOf(settings.level);
  const level = levels.indexOf(vuln.severity);

  if (level < baseLevel) {
    return true;
  }
  if (vuln.paths.length) {
    return vuln.paths.every(path => settings.ignore.some(item => ignoreMatch(item, { ...vuln, path })));
  }
  return settings.ignore.some(item => ignoreMatch(item, { vuln }));
};

const evaluate = async (report, settings) => {
  if (report.auditReportVersion !== 2) {
    throw Error(`Unsupported npm audit version`);
  }
  const vulns = report.vulnerabilities;
  const results = [];

  const buildPaths = (vuln) => {
    if (vuln.isDirect || !vuln.effects.length) {
      return [vuln.name];
    }
    const paths = flatten(vuln.effects.map(dep => buildPaths(vulns[dep])));
    return paths.map(p => `${p}>${vuln.name}`);
  };

  Object.values(vulns).forEach(vuln => {
    vuln.via.forEach(via => {
      if (typeof via === 'string') {
        return;
      }
      const paths = buildPaths(vuln).sort();
      const result = { ...via, paths };
      result.ignored = isIgnored(result, settings);
      results.push(result);
    });
  });

  const advisories = results.length;
  const ignored = results.filter(adv => adv.ignored).length;
  const passed = results.every(adv => adv.ignored);

  return {
    output: {
      results,
      passed,
      advisories,
      ignored
    },
    code: passed ? 0 : 1
  };
};

const audit = async (options = {}) => {
  const settings = await normaliseOptions(options);
  const result = await runAudit(settings);

  return evaluate(result, settings);
};

module.exports = audit;
