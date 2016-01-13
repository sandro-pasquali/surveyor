"use strict";

var Path = require('path');
var fs = require('fs');
var util = require('util');
var glob = require('glob');
var tape = require('blue-tape');
var harness = require('pushpin');
var Promise = require('bluebird');
var _ = require('lodash');

Promise.longStackTraces();

// @param opts {Object} Configuration options
// @param [opts.testDir]    The directory to run tests in. Should be absolute.
//                          Default process.cwd()
// @param [opts.specDir]    String name of folder under #testDir where test spec
//                          files are located. Default `spec`
// @param [opts.fixtureDir] String name of folder under #testDir where test fixture
//                          files are located. Default `fixture`
// @param [opts.reporter]   A string argument suitable for #require indicating where
//                          to find the TAP reporter suitable for @pushpin.
//                          Default '@pushpin-white'
// @param [opts.globalFixtures] An Array of fixtures that should wrap every test.
// @param [opts.exitOnFinish]   Whether to process.exit(0) when test is complete
//                              Default false
//
module.exports = function(opts) {

    var testDir = opts.testDir || process.cwd();
    var specDir = opts.specDir || 'spec';
    var fixtureDir = opts.fixtureDir || 'fixture';
    var globalFixtures = _.isArray(opts.globalFixtures) ? opts.globalFixtures : [];
    var exitOnFinish = _.isBoolean(opts.exitOnFinish) ? opts.exitOnFinish : true;

    // If a non-reachable reporter is sent, unadorned TAP output will result
    // (surveyor accepts a null argument as valid). So, it is ok to not
    // send a reporter simply by defining #reporter as anything other than undefined,
    // such as Boolean false.
    //
    var reporter;
    try {
        reporter = require(typeof opts.reporter !== 'undefined' ? opts.reporter : 'pushpin-white');
    } catch(e) {}

    // To run specific tests, pass them along via command line.
    // @example	> node test fixtureA fixtureB ...
    //
    var tests = process.argv.splice(2);

    if(tests.length) {
        tests = tests.map(function(name) {
            return util.format(Path.resolve(testDir) + '/%s/%s.js', specDir, name);
        });
    } else {
        // Otherwise, run them all
        //
        tests = glob.sync(Path.resolve(testDir, specDir, '**/*.js'));
    }

    // Grab the requested fixture and merge into #into
    //
    function tryToMergeFixture(into, fromPath, test, isGlobal) {

        var fixture = {};
        var filebase = Path.basename(fromPath, '.js');
        var f;

        try {

            f = require(fromPath);

            // If the fixture returns a function, expect that the fixture
            // itself will be returned by calling that function.
            //
            if(typeof f === 'function') {

                f = f(test);
            }

            // Fail if a fixture Object was not produced.
            //
            if(_.isPlainObject(f)) {

                fixture = f;

            } else {

                throw new Error(util.format(
                    'Fixture <%s> must be Object, or a Function that returns an Object. Received: %s -> %s',
                        filebase,
                        typeof f,
                        f));
            }

            into = _.merge(into, fixture);

        } catch(err) {

            // If a requested global fixture was not found, report that.
            // "local" fixtures don't necessarily exist for all spec files
            // so not found errors are ok.
            //
            if(isGlobal) {
                test.fail(util.format('Unable to load global fixture <%s> -> %s', filebase, err.message));
            }
        }
    }

    var harnessReporter = harness(reporter);

    // Tap into stream of tests, report, and pipe results to
    // any writable stream.
    //
    tape
        .createStream({ objectMode: true })
        .pipe(harnessReporter.stream)
        .pipe(process.stdout);


    // When all tests have completed tell reporter about it.
    //
    tape.onFinish(function() {
        harnessReporter.finish({
            total : this.count,
            pass : this.pass,
            fail : this.fail
        });

        exitOnFinish && process.exit(0);
    })

    tests.forEach(function(path) {

        // tape(path...)
        // The test file #path is used here as the test name.
        // You can change that to any other String you'd like.
        //
        tape(path, function(t) {

            var fixtures = {};

            // Merge the requested global fixtures.
            //
            globalFixtures.forEach(function(gf) {
                tryToMergeFixture(fixtures, Path.resolve(testDir, fixtureDir, gf), t, true);
            });

            // Merge the test-specific fixture, if any.
            //
            tryToMergeFixture(fixtures, Path.resolve(testDir, fixtureDir, Path.basename(path)), t);

            return (require(path).bind(fixtures))(t, Promise);

        })
    });
};