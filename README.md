# ciaudit

Wrapper for npm audit to allow configurable severity levels and support ignore lists for specific advisories.

## Basic usage

Define a base severity level by passing a flag of `--low`, `--moderate`, `--high` or `--critical`. Default: `low`

```
# as an installed module
$ ciaudit [--moderate | --high | --critical]
# with npx
$ npx @lennym/ciaudit [--moderate | --high | --critical]
```

This process will output a JSON formatted report and will exit with a non-zero exit code if any non-ignored advisories are detected.

### Other options

* `--production` - ignore dev dependencies when running audit (Default: `false`)

Note: `--production` will be inherited from npm CLI, so if running via an npm script `npm run audit --production` will be equivalent to `npm run audit -- --production`

* `--ignorefile` - use specified file to load ignore list (Default: `./.auditignore`)

By default an installed version of `@npmcli/arborist` is used to perform the audit, and so is not dependent on the locally installed npm runtime. However, this can be overridden by passing a `--local` flag.

* `--local` - use locally installed npm version to perform audit (Default: `false`)

## Ignore file

Advisories can be ignore by listing in an ignore file - default `.auditignore`.

Entries in the ignore file can be defined based on source, module name, and install path. Install paths are separated by `>` and can include wildcards (`*`).

```
# ignore advisory with source id 1005560
1005560

# ignore advisories relating to package `node-fetch`
node-fetch

# ignore advisories in child/descendant dependencies of `webpack`
webpack>* 
```

### Advanced usage

Ignore file entries can be combined by using a `&&` separator. In this case _all_ conditions must be met for the advisory to be ignored.

In the following example, advisory 1006947 (related to the `glob-parent` module) is ignored only when it appears as a descendant of `webpack`.

```
# ignore 1006947 as a descendant of webpack
1006947 && webpack>*
```

### Note on path matching

Due to [a bug in `npm`](https://github.com/npm/cli/issues/4366) at time of writing, some reported install paths may be incomplete and not include a complete set of ancestor dependencies where a module with an advisory has multiple install paths with a common ancestor.

## Updating from v1.x

v2.0.0 is a total ground-up rewrite of the module to solve a different set of problems that have emerged as `npm audit` has developed and matured.

As such it should be considered a complete breaking change, and a from-scratch reimplementation is recommended.
