# expirable-synchronized [![Build Status](https://travis-ci.org/Pike96/expirable-synchronized.svg?branch=master)](https://travis-ci.org/Pike96/expirable-synchronized)

> A decorator to make Promise function synchronized safely (with expiration time)

Similar to Java's `@synchronized`, this decorator can make a function atomic! All function calls are ordered by FIFO manner.

***The function to apply this decorator must return a promise***

#### How it works:

It connects all function calls into a promise chain. 
It's safe because you can set an expiry time. 
If one call in the chain takes too long to resolve / reject, the next in the chain will be executed

It uses a pointer to build promise chain. 
The promise is saved in the function's `target`(who calls the function). 
This target is the class instance in most cases.

## Installation
Using npm: 

`npm install --save expirable-synchronized`

Using yarn:

`yarn add expirable-synchronized`

## Requirements
An environment that supports stage-0 of the decorators spec.

#### If you use transpiler
- For Babel: You need a decorator plugin
    - [For Babel 6](https://www.npmjs.com/package/babel-plugin-transform-decorators-legacy)
    - [For Babel 7](https://www.npmjs.com/package/@babel/plugin-proposal-decorators)
- For TypeScript: 
You need to turn on `experimentalDecorators`. 
[Official docs](https://www.typescriptlang.org/docs/handbook/decorators.html)

## How to Use
Just add `@expirableSynchronized()` above the function that returns a promise. 
According to [current stage of decorator proposal](https://github.com/tc39/proposal-decorators), 
the function has to be a class member.

```
class A {
    @expirableSynchronized()
    anyFunctionThatReturnsAPromise() {
        // ...
    }

    @expirableSynchronized(2000)
    anyFunctionThatReturnsAPromise2() {
        // ...
    }

    @expirableSynchronized(2000, 'your-custom-prefix-')
    anyFunctionThatReturnsAPromise3() {
        // ...
    }
}
```

### Options
| Parameter | Description                                                                                                                                                                                 | Type   | Default Value                          |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------|----------------------------------------|
| `life`    | The promise life limit. <br> After this amount of time, the next promise in chain will be executed anyway <br> Default value is 5 seconds (other packages like jest has 5s as timeout also) | number | 5000                                   |
| `prefix`  | The prefix for the name of promise pointer living in the caller object. <br> Set this parameter in case that the default prefix has conflict with your existing object key                  | string | `expirable-synchronized-last-promise-` |