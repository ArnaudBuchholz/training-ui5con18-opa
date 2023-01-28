/* eslint-disable strict */
module.exports = function(config) {
  require("./karma.conf")(config);
  config.set({
    preprocessors: {
      'webapp/{,!(test)}/*.js': ['coverage']
    },
    coverageReporter: {
      includeAllSources: true,
      reporters: [{
        type: 'html',
        dir: '../coverage/'
      }, {
        type: 'text'
      }],
      check: {
        each: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100
        }
      }
    },
    reporters: ['progress', 'coverage'],
    browsers: ['ChromeHeadless'],
    singleRun: true
  });
  require("karma-ui5/helper").configureIframeCoverage(config);
};
