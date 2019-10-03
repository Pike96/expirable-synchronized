# expirable-synchronized 

[![Build Status](https://travis-ci.org/Pike96/expirable-synchronized.svg?branch=master)](https://travis-ci.org/Pike96/expirable-synchronized)
[![npm](https://img.shields.io/npm/dt/expirable-synchronized.svg)](https://www.npmjs.com/package/expirable-synchronized)
![npm](https://img.shields.io/npm/v/expirable-synchronized.svg)
![GitHub](https://img.shields.io/github/license/Pike96/expirable-synchronized.svg)

> A decorator to make any function that returns promise atomic with expiration

Similar to Java's `@synchronized`, this decorator can make a function atomic!

There are two modes:

- `Fair`: `@expirableSynchronized` or `@expirableSynchronizedFair`

  Queue up all function calls. The next function call in queue can only start after the previous one finishes. The function acts like a fair lock added.

- `Exclusive`: `@expirableSynchronizedExclusive`

  Drop all other function calls when there is one hasn't finished.

***The function to apply this decorator must return a promise***

## Use Case:
When you want to use it & Other solutions if you don't really need it:
- The function has asynchronous jobs and the order matters. (Otherwise, you don't need to do anything.)
- The function is not called by your program, or it's hard to manage the function caller. A typical example is event listener. (Otherwise, you should improve your code where the function caller is in.)
- You need the expiration. (Otherwise, consider using RxJS's [asyncScheduler](https://rxjs-dev.firebaseapp.com/api/index/const/asyncScheduler), schedule in a subscription.)
- If RxJS is too big for your project to include. (Otherwise, RxJS is your answer.)

## How it works:

### `Fair`:
It connects all function calls into a promise chain. 
It's safe because you can set an expiry time. 
If one call in the chain takes too long to resolve / reject, the next in the chain will be executed

It uses a pointer to build promise chain. 
The promise is saved in the function's `target`(who calls the function). 
This target is the class instance in most cases.

### `Exclusive`:
It locks when a function call starts, release it when it's done. No other function call by the same caller can run during the time that this function is locked, and won't run later.


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
Just add `@expirableSynchronized()` or `@expirableSynchronizedExclusive()` above the function that returns a promise. 
According to [current stage of decorator proposal](https://github.com/tc39/proposal-decorators), 
the function has to be a class member.

```
class Example {
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

    @expirableSynchronizedExclusive()
    anyFunctionThatReturnsAPromise4() {
        // ...
    }

    @expirableSynchronizedExclusive(2000)
    anyFunctionThatReturnsAPromise5() {
        // ...
    }

    @expirableSynchronizedExclusive(2000, 'your-custom-prefix-')
    anyFunctionThatReturnsAPromise6() {
        // ...
    }
}
```

### Options
| Parameter | Description                                                                                                                                                                                                                                               | Type   | Default Value             |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------|---------------------------|
| `life`    | The promise life limit. <br> After this amount of time, the next promise in chain will be executed anyway in Fair mode, lock will be released any way in Exclusive mode <br> Default value is 5 seconds (other packages like jest has 5s as timeout also) | number | 5000                      |
| `prefix`  | The prefix for the name of lock / promise pointer living in the caller object (class instance). <br> Set this parameter in case that the default prefix has conflict with your existing object key                                                        | string | `expirable-synchronized-` |
