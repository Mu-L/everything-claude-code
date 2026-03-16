'use strict';

const { createClaudeHistoryAdapter } = require('./claude-history');
const { createDmuxTmuxAdapter } = require('./dmux-tmux');

function buildDefaultAdapterOptions(options, adapterId) {
  const sharedOptions = {
    loadStateStoreImpl: options.loadStateStoreImpl,
    persistSnapshots: options.persistSnapshots,
    recordingDir: options.recordingDir,
    stateStore: options.stateStore
  };

  return {
    ...sharedOptions,
    ...(options.adapterOptions && options.adapterOptions[adapterId]
      ? options.adapterOptions[adapterId]
      : {})
  };
}

function createDefaultAdapters(options = {}) {
  return [
    createClaudeHistoryAdapter(buildDefaultAdapterOptions(options, 'claude-history')),
    createDmuxTmuxAdapter(buildDefaultAdapterOptions(options, 'dmux-tmux'))
  ];
}

function createAdapterRegistry(options = {}) {
  const adapters = options.adapters || createDefaultAdapters(options);

  return {
    adapters,
    select(target, context = {}) {
      const adapter = adapters.find(candidate => candidate.canOpen(target, context));
      if (!adapter) {
        throw new Error(`No session adapter matched target: ${target}`);
      }

      return adapter;
    },
    open(target, context = {}) {
      const adapter = this.select(target, context);
      return adapter.open(target, context);
    }
  };
}

function inspectSessionTarget(target, options = {}) {
  const registry = createAdapterRegistry(options);
  return registry.open(target, options).getSnapshot();
}

module.exports = {
  createAdapterRegistry,
  createDefaultAdapters,
  inspectSessionTarget
};
