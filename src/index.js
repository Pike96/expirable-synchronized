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
 * @param life: How long we wait for a function to return a promise
 */
export function expirableSynchronized(life = DEFAULT_PROMISE_LIFE) {
    /**
     * Inner decorator that takes function execution environment
     *
     * @param target: Function caller
     * @param funcName: Name of the function
     * @param descriptor: Details of the function
     */
    return function decorator(target, funcName, descriptor) {
        // The pointer to build then-chain
        const pName = LAST_PROMISE_PREFIX + funcName;
        const clearLastPromise = () => {
            target[pName] = null;
        };

        const original = descriptor.value;
        if (typeof original === 'function') {
            descriptor.value = function(...args) {
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
                    const initPromise = new Promise(res => {res('Sentinel/Dummy Promise')});
                    if (!target[pName]) { // If pointer is empty, run it
                        target[pName] = initPromise;
                    }
                    target[pName] = target[pName].then(applyDecoratee).catch(applyDecoratee);

                    // Race 2 promises. Only winner will be in the promise chain
                    target[pName] = Promise.race([
                        target[pName],
                        timeout
                    ]).then(() => {clearTimeout(timeoutId);})
                        .catch(() => {clearTimeout(timeoutId);});

                    // Clear the pointer after done
                    target[pName] = target[pName].then(clearLastPromise).catch(clearLastPromise);
                    target[ LAST_PROMISE_PREFIX + funcName ] = target[pName];
                    return target[pName];
                }
                catch (e) {
                    throw e;
                }
            };
        }
        return descriptor;
    };
}