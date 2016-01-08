"use strict";

module.exports = function(test, Promise) {

    test.equal(this.fixtureKey, 'nopromise', 'nopromise spec fixture was correctly assigned');

    test.equal(this.globalBKey, 'globalBValue', 'nopromise spec was assigned globalB fixture');

    return Promise.delay(200);
};