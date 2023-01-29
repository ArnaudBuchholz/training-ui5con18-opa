/* eslint-disable strict */
var fs = require('fs');
var version = process.argv[2];

function update (fileName) {
  fs.writeFileSync(fileName, fs.readFileSync(fileName)
    .toString()
    .replace(/https:\/\/ui5.sap.com\/([^"/]+)/, function (match, oldVersion) {
      return match.replace(oldVersion, version);
    })
  );
}

update('karma.conf.js');
update('reserve.json');
update('webapp/load-ui5.js');
