// Karma configuration
// Generated on Wed Jun 13 2018 14:38:44 GMT+0200 (CEST)

module.exports = function(config) {
	config.set({
		frameworks: ['ui5'],
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
