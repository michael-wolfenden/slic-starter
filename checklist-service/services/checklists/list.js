'use strict'

const checklist = require('./checklist')
const { middify } = require('slic-tools/middy-util')
const { processEvent } = require('slic-tools/event-util')

async function main(event) {
  const { userId } = processEvent(event)
  return checklist.list({ userId })
}

module.exports = middify({ main })
