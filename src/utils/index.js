'use strict'

const _ = require('lodash')

const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields)
}

const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((item) => [item, 1]))
}

const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((item) => [item, 0]))
}

const removeUndefinedObject = (obj) => {
  Object.keys(obj).forEach((key) => obj[key] === null && delete obj[key])

  return obj
}

const updateNestedProjectParser = (obj) => {
  const final = {}
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'Object' && !Array.isArray(obj[key])) {
      const response = updateNestedProjectParser(obj[key])
      Object.keys(response).forEach((key2) => {
        final[`${key}.${key2}`] = response[key2]
      })
    } else {
      final[key] = obj[key]
    }
  })
}

module.exports = {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedObject,
  updateNestedProjectParser,
}
