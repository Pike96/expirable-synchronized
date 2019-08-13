import {
  expirableSynchronized,
  expirableSynchronizedExclusive,
  expirableSynchronizedNonFair,
} from './index';

/**
 * Util function to do setTimeout in promise way
 * @param ts
 * @returns {Promise<unknown>}
 */
const delay = ts => new Promise( resolve => setTimeout( resolve, ts ) );

const customPrefixName = 'unable-to-come-up-with-a-cool-prefix-so-let-it-be-';

/**
 * Class to test
 */
class Test {
  count = 0;
  executionArr = [];

  /**
   * Reset all counters and arrays for every test
   */
  reset() {
    this.count = 0;
    this.executionArr = [];
  }

  /**
   * Increse counts by $segments$ times with $ts$ interval
   * @param segments: Number of counts to increase in totol for this function
   * @param ts: Duration of segment interval (also the delay for the 1st segment)
   * @param i: Which function call it is
   * @returns {Promise<void>}
   */
  @expirableSynchronized()
  async increaseCountsWithInterval( segments, ts, i ) {
    for ( let j = 0; j < segments; j++ ) {
      await delay( ts );
      this.count++;
      this.executionArr.push( { call: i, segment: j, count: this.count } );
    }
  }

  /**
   * The duplicate function of increaseCountsWithInterval, with the only difference of timoeut setting
   * @param segments: Number of counts to increase in totol for this function
   * @param ts: Duration of segment interval (also the delay for the 1st segment)
   * @param i: Which function call it is
   * @returns {Promise<void>}
   */
  @expirableSynchronized( 300 )
  async increaseCountsWithInterval2( segments, ts, i ) {
    for ( let j = 0; j < segments; j++ ) {
      await delay( ts );
      this.count++;
      this.executionArr.push( { call: i, segment: j, count: this.count } );
    }
  }

  /**
   * Increase count by 1 with the delay of $ts$ time
   * @param ts: Delay for the count increment
   * @param i: Which function call it is
   * @returns {Promise<void>}
   */
  @expirableSynchronized( 300 )
  async increaseCountWithTime( ts, i ) {
    await delay( ts );
    this.count++;
    this.executionArr.push( { call: i, count: this.count } );
  }

  /**
   * The duplicate function of increaseCountWithTime, with a different prefix setting
   * @param ts: Delay for the count increment
   * @param i: Which function call it is
   * @returns {Promise<void>}
   */
  @expirableSynchronized( 300, customPrefixName )
  async increaseCountWithTime2( ts, i ) {
    await delay( ts );
    this.count++;
    this.executionArr.push( { call: i, count: this.count } );
  }

  @expirableSynchronizedExclusive()
  async increaseCountWithTime3( ts, i ) {
    await delay( ts );
    this.count++;
    this.executionArr.push( { call: i, count: this.count } );
  }

  @expirableSynchronizedExclusive( 500 )
  async increaseCountWithTime4( ts, i ) {
    await delay( ts );
    this.count++;
    this.executionArr.push( { call: i, count: this.count } );
  }
}
// Global instance to run all tests
const instance = new Test();

describe( 'fair mode', () => {
  test( '5*10ms delayed counts executed 10 times per 1ms', async () => {
    const segments = 5;
    instance.reset();

    for ( let i = 0; i < 10; i++ ) {
      instance.increaseCountsWithInterval( segments, 10, i );
      await delay( 1 );
    }

    // Wait for all function calls to finish
    await delay( 1000 );

    /**
     * Counts should in the right order:
     * No later segment finish before any previous segment & No later call finishes before any previous call
     */
    for ( const item of instance.executionArr ) {
      expect( item.call ).toBe( Math.floor( ( item.count - 1 ) / segments ) );
      expect( item.segment ).toBe( ( item.count - 1 ) % segments );
    }
  } );

  test( '3*100ms delayed counts executed 5 times per 10ms', async () => {
    const segments = 3;
    instance.reset();

    for ( let i = 0; i < 5; i++ ) {
      instance.increaseCountsWithInterval( segments, 100, i );
      await delay( 10 );
    }

    // Wait for all function calls to finish
    await delay( 3000 );

    /**
     * Counts should in the right order:
     * No later segment finish before any previous segment & No later call finishes before any previous call
     */
    for ( const item of instance.executionArr ) {
      expect( item.call ).toBe( Math.floor( ( item.count - 1 ) / segments ) );
      expect( item.segment ).toBe( ( item.count - 1 ) % segments );
    }
  } );

  test( 'shorter timeout with segments', async () => {
    const segments = 2;
    instance.reset();
    instance.increaseCountsWithInterval2( segments, 500, 0 );
    await delay( 10 );
    instance.increaseCountsWithInterval2( segments, 100, 1 );

    // Wait for all function calls to finish
    await delay( 2000 );

    // Have to hard code the timeout behavior results here
    const arr = instance.executionArr;
    const expectedCallOrder = [ 1, 0, 1, 0 ];
    const expectedSegmentOrder = [ 0, 0, 1, 1 ];
    for ( const i in expectedCallOrder ) {
      expect( arr[ i ].call ).toBe( expectedCallOrder[ i ] );
      expect( arr[ i ].segment ).toBe( expectedSegmentOrder[ i ] );
      expect( arr[ i ].count ).toBe( Number( i ) + 1 );
    }
  } );

  test( 'shorter timeout', async () => {
    instance.reset();
    instance.increaseCountWithTime( 500, 0 );
    await delay( 10 );
    instance.increaseCountWithTime( 100, 1 );
    await delay( 10 );
    instance.increaseCountWithTime( 100, 2 );

    // Wait for all function calls to finish
    await delay( 1000 );

    // Have to hard code the timeout behavior results here
    const arr = instance.executionArr;
    const expectedOrder = [ 1, 2, 0 ];
    for ( const i in expectedOrder ) {
      expect( arr[ i ].call ).toBe( expectedOrder[ i ] );
      expect( arr[ i ].count ).toBe( Number( i ) + 1 );
    }
  } );

  test( 'shorter timeout with different prefix', async () => {
    instance.reset();
    instance.increaseCountWithTime2( 500, 0 );
    await delay( 10 );
    instance.increaseCountWithTime2( 100, 1 );
    await delay( 10 );
    instance.increaseCountWithTime2( 100, 2 );

    // Wait for all function calls to finish
    await delay( 1000 );

    // Have to hard code the timeout behavior results here
    const arr = instance.executionArr;
    const expectedOrder = [ 1, 2, 0 ];
    for ( const i in expectedOrder ) {
      expect( arr[ i ].call ).toBe( expectedOrder[ i ] );
      expect( arr[ i ].count ).toBe( Number( i ) + 1 );
    }

    /**
     * If prefix doesn't work, the pointer should be undefined
     * After all function finishes, it should be null due to clearLastPromise
     */
    !expect( instance[ `${customPrefixName}increaseCountWithTime2` ] ).toBeNull();
  } );
} );

describe( 'exclusive mode', () => {
  test( 'normal finish', async () => {
    instance.reset();
    instance.increaseCountWithTime3( 500, 0 );

    for ( let i = 1; i < 5; i++ ) {
      await delay( 200 );
      instance.increaseCountWithTime3( 1, i );
    }

    // Wait for all function calls to finish
    await delay( 1500 );

    // Call 1 and 2 are dropped
    const arr = instance.executionArr;
    const expectedOrder = [ 0, 3, 4 ];
    for ( const i in expectedOrder ) {
      expect( arr[ i ].call ).toBe( expectedOrder[ i ] );
      expect( arr[ i ].count ).toBe( Number( i ) + 1 );
    }
  } );

  test( 'timeout finish', async () => {
    instance.reset();
    instance.increaseCountWithTime4( 800, 0 );

    for ( let i = 1; i < 5; i++ ) {
      await delay( 200 );
      instance.increaseCountWithTime4( 1, i );
    }

    // Wait for all function calls to finish
    await delay( 1500 );

    // Call 1 and 2 are dropped before call 0 timed out. 3 and 4 are not affected.
    const arr = instance.executionArr;
    const expectedOrder = [ 3, 0, 4 ];
    for ( const i in expectedOrder ) {
      expect( arr[ i ].call ).toBe( expectedOrder[ i ] );
      expect( arr[ i ].count ).toBe( Number( i ) + 1 );
    }
  } );
} );
