/* eslint-disable strict */
module.exports = function (config) {
  config.set({
    frameworks: ['ui5'],
    ui5: {
      url: "https://ui5.sap.com/1.110.0"
    },    
    reporters: ['progress'],
    logLevel: config.LOG_INFO,
    browserConsoleLogOptions: {
      level: 'warn'
    },
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};
