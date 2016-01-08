## surveyor

A quick way to set up TAP reporting

## Usage

From within whichever file will kick off your testing:

```
require('surveyor')({
    testDir: 'pathToTestFolder',
    specDir: 'specFolder', // Optional. Default is 'spec', eg. {testDir}/spec
    globalFixtures: [ // Optional. These files are expected to return test scopes
        'globals/A',
        'globals/B'
    ]
});
```

## How to define test files

`surveyor` will run through all the `.js` files in `{testDir}/spec` and run them through a `TAP` reporter.

This module is designed for testing `Promise`-based applications, where it is expected that the functionality you are testing returns promises, where tests would be written in a style similar to the following:

```
module.exports = function(test, Promise) {

    return getRecord()
    .then(function(rec) {

        test.ok(someTestAgainstRec);

        return updateUser()
    })
    .then(function(user) {

        test.ok(someTestAgainstUser);

        return ...
    });
};
```

If you will be writing tests where the above syntax is inappropriate, you need simply terminate your test specification with a resolved `Promise`:

```
module.exports = function(test, Promise) {

    test.equal(1,1);
    test.notEqual(1,0);

    return Promise.resolve();
};
```

You need not `require` a `Promise` library, as it will be provided for you (note function signature)

## TODO

Add other reporters

