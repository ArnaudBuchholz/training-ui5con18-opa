![OpenUI5 logo](http://arnaudbuchholz.github.io/decks/UI5Con'18%20A%20journey%20with%20OPA/OpenUI5_new_big_side.png)

# training-uicon18-opa
> [OpenUI5](https://github.com/SAP/openui5) sample app to demonstrate UI5's OPA (UICon'18)

* copied from [openui5-sample-app](https://github.com/SAP/openui5-sample-app)
* Uses [OData Model](https://openui5.hana.ondemand.com/#/api/sap.ui.model.odata.v2.ODataModel) to manipulate todo items
* Relies on [MockServer](https://openui5.hana.ondemand.com/#/api/sap.ui.core.util.MockServer) to simulate backend
* Fully tested with [OPA](https://openui5.hana.ondemand.com/#/api/sap.ui.test.Opa5)
* [Presentation slides](http://arnaudbuchholz.github.io/decks/UI5Con'18%20A%20journey%20with%20OPA.html#/)
* [UI5con@SAP 2018 - A journey with OPA](https://youtu.be/HiZq-kuIbt0)

[![Travis-CI](https://travis-ci.org/ArnaudBuchholz/training-ui5con18-opa.svg?branch=master)](https://travis-ci.org/ArnaudBuchholz/training-ui5con18-opa#)

## Prerequisites
- The **UI5 CLI** of the [UI5 Build and Development Tooling](https://github.com/SAP/ui5-tooling#installing-the-ui5-cli).
    - For installation instructions please see: [Installing the UI5 CLI](https://github.com/SAP/ui5-tooling#installing-the-ui5-cli).

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
* Install all npm dependencies (also installs all bower dependencies) *you might need to have administrator rights*
    ```sh
    npm install
    ```

* Start a local server and run the application (http://localhost:8080/index.html)
    ```sh
    npm start
    ```

## Usage
### Server
Run `npm run serve` to start a local server with your application at [http://localhost:8080](http://localhost:8080).

Run `npm run watch` to also execute your unit tests automatically after every change.

### Code validation
Run `npm run lint` to run static code checks on your project.

Run `npm  test` to execute all tests and get a coverage report.

Run `npm run serve` and open [http://localhost:8080/test/integration/opaTests.qunit.html](http://localhost:8080/test/integration/opaTests.qunit.html) to run the OPA tests in your browser.

### Build
Run `npm build` to build a deployable version of your app to `/dist`.

### Follow-up exercises
Despite the 100% coverage, there are still issues in the application:
* In the dialog, the date/time pickers could be bound to an invalid property, no test will fail
* In the dialog, the "Due date" date/time picker is *not* validated. If one enters an invalid date, no error is shown.
Worse, the dialog is not refreshed properly when re-opened.
* In the dialog, when the server throws an error, the dialog is closed.
But it would be better to keep the dialog opened to allow the user to change the value.
For instance: what if the backend rejects empty titles?
