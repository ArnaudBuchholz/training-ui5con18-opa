"use strict";

const fs = require('fs')
const { join } = require('path')
const util = require('util')
const [,,scenario] = process.argv

const copyFile = util.promisify(fs.copyFile)
const readdir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)

console.log(`Setup of scenario '${scenario}'...`)

async function copy (path) {
  const promises = [];
  (await readdir(join(`./workshop/${scenario}/setup`, path))).forEach(async function (name) {
    const subPath = join(path, name)
    const srcPath = join(`./workshop/${scenario}/setup`, subPath)
    if ((await stat(srcPath)).isDirectory()) {
      promises.push(copy(subPath))
    } else {
      promises.push(copyFile(srcPath, join(`./`, subPath)))
    }
  })
  return Promise.all(promises)
}

copy('.').then(() => console.log('done.'))
