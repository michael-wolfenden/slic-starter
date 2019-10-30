'use strict'

const util = require('util')
const zlib = util.promisify(require('zlib').gunzip)

module.exports = {
  process
}

async function process(event, context, callback) {
  let success = 0 // Number of valid entries found
  let failure = 0 // Number of invalid entries found

  const result = await Promise.all(event.records.map(mapRecord))

  console.log({ success, failure }, 'Processing completed')

  async function mapRecord(record, done) {
    try {
      const payload = await gunzip(new Buffer(record.data, 'base64'))
    } catch (err) {
      console.error({ err }, 'Failed to decompress record')
      failure++
      return {
        recordId: record.recordId,
        result: 'ProcessingFailed',
        data: record.data
      }
    }
    log.info({ payload: payload.toString() }, 'Decoded payload')
    try {
      const parsed = JSON.parse(payload)
      success++
      return {
        recordId: record.recordId,
        result: 'Ok',
        data: new Buffer(JSON.stringify(parsed)).toString('base64')
      }
    } catch (err) {
      failure++
      log.warn({ err }, 'Failed to parse payload')
      return {
        recordId: record.recordId,
        result: 'ok',
        data: payload
      }
    }
  }
}
