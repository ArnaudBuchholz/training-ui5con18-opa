"use strict"

require('colors')
const fs = require('fs')
const inquirer = require('inquirer')
const { join } = require('path')
const util = require('util')
const [,,scenario] = process.argv

const copyFile = util.promisify(fs.copyFile)
const readdir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const stat = util.promisify(fs.stat)

console.log(`Setup of scenario '${scenario}'`.yellow)

function copy (folder = 'setup', path = '.') {
  const srcBase = `./workshop/${scenario}/${folder}`
  return readdir(join(srcBase, path))
    .then(names => Promise.all(names
      .map(name => {
        const subPath = join(path, name)
        const srcPath = join(srcBase, subPath)
        return stat(srcPath)
          .then(srcStat => {
            if (srcStat.isDirectory()) {
              return copy(folder, subPath)
            } else {
              console.log(`\t${subPath}`.gray)
              return copyFile(srcPath, join(`./`, subPath))
            }
          })
      })
    ))
}

function next (steps) {
  return inquirer
    .prompt([{
      name: 'step',
      type: 'list',
      message: 'Which step?',
      choices: steps.map(step => step.label)
  }])
    .then(answers => answers.step)
    .then(stepLabel => {
      const step = steps.filter(candidate => candidate.label === stepLabel)[0]
      return copy(step.folder).then(() => next(steps))
    })
}

readFile(`./workshop/${scenario}/steps.json`)
  .then(stepsBuffer => JSON.parse(stepsBuffer.toString()))
  .then(steps => copy()
     .then(() => console.log('done.'.yellow))
     .then(() => next(steps))
  )
