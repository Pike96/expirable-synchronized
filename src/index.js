/**
 * The prefix for the name of promise pointer/boolean  living in the caller object
 * @type {string}
 */
const DEFAULT_PREFIX = 'expirable-synchronized-';
/**
 * The promise life limit. After this amount of time, the next promise in chain will be executed anyway
 * @type {number}
 */
const DEFAULT_PROMISE_LIFE = 5000;

/**
 * Block other function calls when one is in process by connecting all calls into a promise chain
 * Use it as an decorator, can be only applied to function that returns a promise
 *
 * @param life
 * @param prefix
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
    // target[pName]: The pointer to build the promise chain
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

export function expirableSynchronizedNonFair(
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
    // target[pName]: The pointer to build the promise chain
    const flag = prefix + funcName;

    const waitIfLocked = ( id ) => {
      return new Promise( ( res ) => {
        console.log( 'before check', id );
        if ( !target[ flag ] ) {
          console.log( 'pass check', id );
          target[ flag ] = true;
          res();
        }
        else {
          waitIfLocked(id);
          res();
        }
      } );
    };

    const original = descriptor.value;
    if ( typeof original === 'function' ) {
      descriptor.value = async function( ...args ) {
        try {
          const id = Date.now() % 100000;
          await waitIfLocked( id );
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
              target[ flag ] = false;
              console.log( 'after done', id );
              clearTimeout( timeoutId );
            } )
            .catch( () => {
              target[ flag ] = false;
              console.log( 'after done error', id );
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

export function expirableSynchronizedOnce(
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
    // target[pName]: The pointer to build the promise chain
    const flag = prefix + funcName;

    const original = descriptor.value;
    if ( typeof original === 'function' ) {
      descriptor.value = function( ...args ) {
        try {
          if ( target[ flag ] ) {
            return;
          }
          target[ flag ] = true;

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
              target[ flag ] = false;
              clearTimeout( timeoutId );
            } )
            .catch( () => {
              target[ flag ] = false;
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

export function expirableSynchronized(
  life = DEFAULT_PROMISE_LIFE,
  prefix = DEFAULT_PREFIX
) {
  return expirableSynchronizedFair( life, prefix );
}
