"use strict";

module.exports = function(test) {

    test.pass('Tests are running in global fixture context');
    test.fail('Testing failures');

    return {
        globalBKey: 'globalBValue'
    };
};