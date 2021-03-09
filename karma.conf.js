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
