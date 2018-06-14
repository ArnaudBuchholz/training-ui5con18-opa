![OpenUI5 logo](http://openui5.org/images/OpenUI5_new_big_side.png)

# training-uicon18-opa
> [OpenUI5](https://github.com/SAP/openui5) sample app to demonstrate UI5's OPA (UICon'18)

* copied from [openui5-sample-app](https://github.com/SAP/openui5-sample-app)
* Uses [OData Model](https://sapui5.hana.ondemand.com/#/api/sap.ui.model.odata.v2.ODataModel) to manipulate todo items
* Relies on [MockServer](https://sapui5.hana.ondemand.com/#/api/sap.ui.core.util.MockServer) to simulate backend
* Fully tested with [OPA](https://sapui5.hana.ondemand.com/#/api/sap.ui.test.Opa5)
* [UI5Con presentation](http://arnaudbuchholz.github.io/decks/UI5Con'18%20A%20journey%20with%20OPA.html#/)

[![Travis-CI](https://travis-ci.org/ArnaudBuchholz/training-uicon18-opa.svg?branch=master)](https://travis-ci.org/ArnaudBuchholz/training-uicon18-opa#)

## Getting started
* Install Node.js (from [nodejs.org](http://nodejs.org/)).
* Install the Grunt CLI
    ```sh
    npm install --global grunt-cli
    ```
* Clone the repository and navigate into it
    ```sh
    git clone https://github.com/ArnaudBuchholz/training-ui5con18-opa.git
    cd training-ui5con18-opa
    ```
* Install all npm dependencies (also installs all bower dependencies)
    ```sh
    npm install
    ```

## Usage
### Server
Run `grunt serve` to start a local server with your application at [http://localhost:8080](http://localhost:8080).

Run `grunt watch` to also execute your unit tests automatically after every change.

### Code validation
Run `grunt lint` to run static code checks on your project.

Run `grunt test` to execute all tests and get a coverage report.

### Build
Run `grunt build` to build a deployable version of your app to `/dist`.
