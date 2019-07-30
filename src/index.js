/**
 * The name of promise pointer living in the caller object
 * @type {string}
 */
const LAST_PROMISE_PREFIX = 'expirable-synchronized-last-promise-';
const DEFAULT_PROMISE_LIFE = 5000;

/**
 * Block other function calls when one is in process by connecting all calls into a promise chain
 * Use it as an decorator, can be only applied to function that returns a promise
 *
 * @param PROMISE_LIFE: How long we wait for a function to return a promise
 */
export function expirableSynchronized(...args) {
    /**
     * Inner decorator that takes function execution environment
     *
     * @param target: Function caller
     * @param funcName: Name of the function
     * @param descriptor: Details of the function
     */
    return decorate(handleDescriptor, args);
}

function decorate(handleDescriptor, entryArgs) {
    if (isDescriptor(entryArgs[entryArgs.length - 1])) {
        return handleDescriptor(...entryArgs, []);
    } else {
        return function () {
            return handleDescriptor(...Array.prototype.slice.call(arguments), entryArgs);
        };
    }
}

function isDescriptor(desc) {
    if (!desc || !desc.hasOwnProperty) {
        return false;
    }
    const keys = ['value', 'initializer', 'get', 'set'];

    for (let i = 0, l = keys.length; i < l; i++) {
        if (desc.hasOwnProperty(keys[i])) {
            return true;
        }
    }

    return false;
}

function handleDescriptor(target, funcName, descriptor, [life = DEFAULT_PROMISE_LIFE]) {
    const clearLastPromise = () => {
        // The pointer to build then-chain
        target[ LAST_PROMISE_PREFIX + funcName ] = null;
    };

    const original = descriptor.value;
    if (typeof original === 'function') {
        descriptor.value = async function(...args) {
            try {
                // Timeout promise
                let timeoutId;
                let timeout = new Promise((resolve, reject) => {
                    timeoutId = setTimeout(() => {
                        reject('Synchronized function timed out in ' + life + 'ms.');
                    }, life);
                });

                // Function execution promise
                const applyDecoratee = () => original.apply(this, args);
                let promise;
                if (!target[ LAST_PROMISE_PREFIX + funcName ]) { // If pointer is empty, run it
                    promise = applyDecoratee();
                }
                else { // Otherwise, connect the new one with the pointer by 'then'
                    promise = target[ LAST_PROMISE_PREFIX + funcName ].then(applyDecoratee).catch(applyDecoratee);
                }

                // Race 2 promises. Only winner will be in the promise chain
                promise = Promise.race([
                    promise,
                    timeout
                ]).then(() => {clearTimeout(timeoutId);})
                    .catch(() => {clearTimeout(timeoutId);});

                // Clear the pointer after done
                target[ LAST_PROMISE_PREFIX + funcName ] = promise.then(clearLastPromise).catch(clearLastPromise);
                return promise;
            }
            catch (e) {
                throw e;
            }
        };
    }
    return descriptor;
}