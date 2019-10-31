'use strict'

const pino = require('pino')

const { name } = require('./service-info')

const logMethods = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

const parentLogger = pino({
  name,
  level:
    process.env.DEBUG ||
    process.env.IS_OFFLINE ||
    process.env.SLIC_STAGE === 'dev'
      ? 'debug'
      : 'info'
})

let currentLogger = parentLogger

function newContext(context) {
  currentLogger = parentLogger.child({ ctx: context })
  return currentLogger
}

const overrides = {}

logMethods.forEach(functionName => {
  overrides[functionName] = function() {
    currentLogger[functionName].apply(currentLogger, arguments)
  }
})

const log = {
  ...overrides,
  newContext
}

module.exports = log
