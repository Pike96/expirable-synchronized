/**
 * The default promise life limit. After this amount of time, the next promise in chain will be executed anyway
 * @type {number}
 */
const DEFAULT_PROMISE_LIFE = 5000;

/**
 * The default prefix for the name of promise pointer/boolean  living in the caller object
 * @type {string}
 */
const DEFAULT_PREFIX = 'expirable-synchronized-';

/**
 * Hold other function calls and resume them in order when one is in process by connecting all calls into a promise chain
 * Use it as an decorator, can be only applied to function that returns a promise
 *
 * @param life: The promise life limit. After this amount of time, the next promise in chain will be executed anyway
 * @param prefix: The prefix for the name of promise pointer, which lives in the caller object (class instance)
 */
export function expirableSynchronizedFair(
  life = DEFAULT_PROMISE_LIFE,
  prefix = DEFAULT_PREFIX
) {
  /**
   * Inner decorator that takes function execution environment
   *
   * @param target: Function caller
   * @param funcName: Name of the function
   * @param descriptor: Details of the function
   */
  return function decorator( target, funcName, descriptor ) {
    // target[ pName ]: The pointer to build the promise chain
    const pName = prefix + funcName;
    const clearLastPromise = () => {
      target[ pName ] = null;
    };

    const original = descriptor.value;
    if ( typeof original === 'function' ) {
      descriptor.value = function( ...args ) {
        try {
          // Timeout promise
          let timeoutId;
          const timeoutPromise = new Promise( ( resolve, reject ) => {
            timeoutId = setTimeout( () => {
              reject( `Synchronized function timed out in ${life} ms.` );
            }, life );
          } );

          // Function execution promise
          const applyDecoratee = () => original.apply( this, args );
          const initPromise = new Promise( res => {
            res( 'Sentinel/Dummy Promise' );
          } );
          if ( !target[ pName ] ) {
            // If pointer is empty, run it
            target[ pName ] = initPromise;
          }
          target[ pName ] = target[ pName ]
            .then( applyDecoratee )
            .catch( applyDecoratee );

          // Race 2 promises. Only winner will be in the promise chain
          target[ pName ] = Promise.race( [ target[ pName ], timeoutPromise ] )
            .then( () => {
              clearTimeout( timeoutId );
            } )
            .catch( () => {
              clearTimeout( timeoutId );
            } );

          // Clear the pointer after done
          target[ pName ] = target[ pName ]
            .then( clearLastPromise )
            .catch( clearLastPromise );
          return target[ pName ];
        }
        catch ( e ) {
          console.log( `expirable-synchronized: Error in ${funcName}`, e );
          throw e;
        }
      };
    }
    return descriptor;
  };
}

/**
 * Block and drop other function calls when one is in process by locking the function call
 * Use it as an decorator, can be only applied to function that returns a promise
 *
 * @param life: The promise life limit. After this amount of time, the lock will expire
 * @param prefix: The prefix for the name of lock, which lives in the caller object (class instance)
 */
export function expirableSynchronizedExclusive(
  life = DEFAULT_PROMISE_LIFE,
  prefix = DEFAULT_PREFIX
) {
  /**
   * Inner decorator that takes function execution environment
   *
   * @param target: Function caller
   * @param funcName: Name of the function
   * @param descriptor: Details of the function
   */
  return function decorator( target, funcName, descriptor ) {
    // target[ flag ]: The lock to decide whether to drop function call
    const lock = prefix + funcName;

    const original = descriptor.value;
    if ( typeof original === 'function' ) {
      descriptor.value = function( ...args ) {
        try {
          // Directly return if locked
          if ( target[ lock ] ) {
            return;
          }
          // Lock this function
          target[ lock ] = true;

          // Function execution promise
          const applyDecoratee = () => original.apply( this, args );
          const initPromise = new Promise( res => {
            res( 'Sentinel/Dummy Promise' );
          } );
          let promise = initPromise.then( applyDecoratee ).catch( applyDecoratee );

          // Timeout promise
          let timeoutId;
          const timeoutPromise = new Promise( ( resolve, reject ) => {
            timeoutId = setTimeout( () => {
              reject( `Synchronized function timed out in ${life} ms.` );
            }, life );
          } );

          // Race 2 promises. Only winner will be in the promise chain
          promise = Promise.race( [ promise, timeoutPromise ] )
            .then( () => {
              // Release the lock
              target[ lock ] = false;
              clearTimeout( timeoutId );
            } )
            .catch( () => {
              // Release the lock
              target[ lock ] = false;
              clearTimeout( timeoutId );
            } );

          return promise;
        }
        catch ( e ) {
          console.log( `expirable-synchronized: Error in ${funcName}`, e );
          throw e;
        }
      };
    }
    return descriptor;
  };
}

/**
 * The default function for expirableSynchronized is expirableSynchronizedFair
 * @param life: The promise life limit. After this amount of time, the next promise in chain will be executed anyway
 * @param prefix: The prefix for the name of promise pointer, which lives in the caller object (class instance)
 * @returns function expirableSynchronizedFair
 */
export function expirableSynchronized(
  life = DEFAULT_PROMISE_LIFE,
  prefix = DEFAULT_PREFIX
) {
  return expirableSynchronizedFair( life, prefix );
}
