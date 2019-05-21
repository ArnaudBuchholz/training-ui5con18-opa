console.log('Loading UI5...')
require('node-ui5/factory')({
  exposeAsGlobals: true,
  verbose: true
})
  .then(() => {
    console.log('UI5 ready.')
  }, reason => {
    console.error(reason.toString())
  })
