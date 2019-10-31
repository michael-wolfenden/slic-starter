'use strict'

const log = require('../log')
const get = require('lodash/get')

/**
 * Create a new log context on each Lambda invocation with
 * trace and request IDs in a context object for correlation
 */
module.exports = {
  logContext
}

function logContext() {
  return {
    before: function(handler, next) {
      const { event, context: handlerContext = {} } = handler
      const lambdaRequestId = handlerContext.awsRequestId
      const userId = get(event, 'requestContext.authorizer.claims.sub')
      const { 'X-Amz-Request-Id': xAmzRequestId } = event.headers || {}
      const traceId = process.env._X_AMZN_TRACE_ID
      const context = {
        lambdaRequestId,
        xAmzRequestId,
        traceId
      }

      log.newContext(context)
      next()
    }
  }
}
