import { expirableSynchronized } from './index';

/**
 * Util function to do setTimeout in promise way
 * @param ts
 * @returns {Promise<unknown>}
 */
const delay = ts => new Promise( resolve => setTimeout( resolve, ts ) );

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
}
// Global instance to run all tests
const instance = new Test();


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
  expect( arr[ 0 ].call ).toBe( 1 );
  expect( arr[ 0 ].segment ).toBe( 0 );
  expect( arr[ 0 ].count ).toBe( 1 );

  expect( arr[ 1 ].call ).toBe( 0 );
  expect( arr[ 1 ].segment ).toBe( 0 );
  expect( arr[ 1 ].count ).toBe( 2 );

  expect( arr[ 2 ].call ).toBe( 1 );
  expect( arr[ 2 ].segment ).toBe( 1 );
  expect( arr[ 2 ].count ).toBe( 3 );

  expect( arr[ 3 ].call ).toBe( 0 );
  expect( arr[ 3 ].segment ).toBe( 1 );
  expect( arr[ 3 ].count ).toBe( 4 );
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
  expect( arr[ 0 ].call ).toBe( 1 );
  expect( arr[ 0 ].count ).toBe( 1 );

  expect( arr[ 1 ].call ).toBe( 2 );
  expect( arr[ 1 ].count ).toBe( 2 );

  expect( arr[ 2 ].call ).toBe( 0 );
  expect( arr[ 2 ].count ).toBe( 3 );
} );
