# expirable-synchronized 

[![Build Status](https://travis-ci.org/Pike96/expirable-synchronized.svg?branch=master)](https://travis-ci.org/Pike96/expirable-synchronized)
![Test Coverage](https://github.com/Pike96/expirable-synchronized/raw/master/coverage/badge.svg?sanitize=true)
[![npm](https://img.shields.io/npm/dt/expirable-synchronized.svg)](https://www.npmjs.com/package/expirable-synchronized)
![npm](https://img.shields.io/npm/v/expirable-synchronized.svg)
![GitHub](https://img.shields.io/github/license/Pike96/expirable-synchronized.svg)

> A JavaScript decorator to atomize any function that returns promise. The waiting to resolve can expire after some time.

Similar to Java's `@synchronized`, this decorator can atomize a function!

If you add this decorator to a function that returns a promise, and call this function multiple times, the function calls will be executed in a certain way. There are two modes:

- `Fair`: `@expirableSynchronized` or `@expirableSynchronizedFair`

  Queue up all function calls. The next function call in the queue can only start after the previous one finishes. The function acts like a fair lock added.

- `Exclusive`: `@expirableSynchronizedExclusive`

  Drop all other function calls when there is a function call that hasn't finished.

***The function to apply this decorator must return a promise***

Notice that this decorator doesn't affect the promise itself, just set when / whether to execute them.

## Use Case:
When you want to use it & Solutions if you don't really need it:
- The function has asynchronous jobs and the order matters. (Otherwise, you don't need to do anything.)
- The function is not called by your program, or it's hard to manage the function caller. A typical example is event listener. (Otherwise, you should refactor your code to better call your function.)
- You need the expiration of waiting to resolve. (Otherwise, consider using RxJS's [asyncScheduler](https://rxjs-dev.firebaseapp.com/api/index/const/asyncScheduler), schedule in a subscription.)
- If RxJS is too big for your project to include. (Otherwise, RxJS is your answer if you don't need the expiration of waiting to resolve.)

## How it works:

### `Fair`:
It connects all function calls into a promise chain. 
It's safe because you can set an expiry time to stop waiting for the promise to resolve. 
If one call in the chain takes too long to resolve / reject, the next in the chain will be executed.

It uses a pointer to build promise chain. 
The promise is saved in the function's `target`(who calls the function). 
This target is the class instance in most cases.

### `Exclusive`:
It locks the function when a function call starts, release it when it's done. No other function call by the same caller can run when this function is locked, and won't run later.


## Installation
Using npm: 

`npm install --save expirable-synchronized`

Using yarn:

`yarn add expirable-synchronized`

## Requirements
- An environment that supports stage-0 of the decorators spec.
- Node 8+.

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
| `life`    | The promise life limit. <br> After this amount of time, the next promise in chain will be executed anyway in Fair mode, lock will be released anyway in Exclusive mode <br> Default value is 5 seconds (other packages like jest has 5s as timeout also) | number | 5000                      |
| `prefix`  | The prefix for the name of lock / promise pointer living in the caller object (class instance). <br> Only set this parameter in case that the default prefix has conflict with your existing object key                                                        | string | `expirable-synchronized-` |
