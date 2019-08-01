import { expirableSynchronized } from "./index";

// jest.setTimeout(6000);

const NUMBER_OF_NORMAL_TEST_LOOPS = 100;
const NUMBER_OF_HEAVY_TEST_LOOPS = 10;

const delay = ts => new Promise(resolve => setTimeout(resolve, ts));

const mock = (i, j, res) => {};

class TestSetOne {
    count = 0;
    executionArr = [];

    reset() {
        this.count = 0;
        this.executionArr = [];
    }

    // increaseCount() {
    //     this.count++;
    // }
    //

    @expirableSynchronized()
    async increaseCountsWithInterval(segments, ts, i) {
        for (let j = 0; j < segments; j++) {
            await delay(ts);
            this.count++;
            this.executionArr.push({call: i, segment: j, count: this.count});
        }
    }

    @expirableSynchronized(300)
    async increaseCountsWithInterval2(segments, ts, i) {
        for (let j = 0; j < segments; j++) {
            await delay(ts);
            this.count++;
            this.executionArr.push({call: i, segment: j, count: this.count});
        }
    }

    @expirableSynchronized(300)
    async increaseCountWithTime(ts, i) {
        await delay(ts);
        this.count++;
        this.executionArr.push({call: i, count: this.count});
    }
}
const testInstance = new TestSetOne();


test("5*10ms delayed counts executed 10 times per 1ms", async () => {
    const segments = 5;
    testInstance.reset();
    for (let i = 0; i < 10; i++) {
        testInstance.increaseCountsWithInterval(segments, 10, i);
        await delay(1);
    }
    // Wait for all function calls to finish
    await delay(1000);
    // Counts should in the right order:
    // No later segment finish before any previous segment & No later call finishes before any previous call
    for (const item of testInstance.executionArr) {
        expect(item.call).toBe(Math.floor((item.count - 1) / segments) );
        expect(item.segment).toBe((item.count - 1) % segments );
    }
});

test("3*100ms delayed counts executed 5 times per 10ms", async () => {
    const segments = 3;
    testInstance.reset();
    for (let i = 0; i < 5; i++) {
        testInstance.increaseCountsWithInterval(segments, 100, i);
        await delay(10);
    }
    // Wait for all function calls to finish
    await delay(3000);
    // Counts should in the right order:
    // No later segment finish before any previous segment & No later call finishes before any previous call
    for (const item of testInstance.executionArr) {
        expect(item.call).toBe(Math.floor((item.count - 1) / segments) );
        expect(item.segment).toBe((item.count - 1) % segments );
    }
});

test("shorter timeout with segments", async () => {
    const segments = 2;
    testInstance.reset();
    testInstance.increaseCountsWithInterval2(segments, 500, 0);
    await delay(10);
    testInstance.increaseCountsWithInterval2(segments, 100, 1);

    // Wait for all function calls to finish
    await delay(2000);

    const arr = testInstance.executionArr;
    expect(arr[0].call).toBe(1);
    expect(arr[0].segment).toBe(0);
    expect(arr[0].count).toBe(1);

    expect(arr[1].call).toBe(0);
    expect(arr[1].segment).toBe(0);
    expect(arr[1].count).toBe(2);

    expect(arr[2].call).toBe(1);
    expect(arr[2].segment).toBe(1);
    expect(arr[2].count).toBe(3);

    expect(arr[3].call).toBe(0);
    expect(arr[3].segment).toBe(1);
    expect(arr[3].count).toBe(4);
});

test("shorter timeout", async () => {
    const segments = 2;
    testInstance.reset();
    testInstance.increaseCountWithTime(500, 0);
    await delay(10);
    testInstance.increaseCountWithTime(100, 1);
    await delay(10);
    testInstance.increaseCountWithTime(100, 2);

    // Wait for all function calls to finish
    await delay(1000);

    const arr = testInstance.executionArr;
    expect(arr[0].call).toBe(1);
    expect(arr[0].count).toBe(1);

    expect(arr[1].call).toBe(2);
    expect(arr[1].count).toBe(2);

    expect(arr[2].call).toBe(0);
    expect(arr[2].count).toBe(3);
});

//
// test("simple sync count", () => {
//     testInstance.reset();
//     for (let i = 0; i < NUMBER_OF_NORMAL_TEST_LOOPS; i++) {
//         testInstance.increaseCount();
//     }
//     expect(testInstance.count).toBe(NUMBER_OF_NORMAL_TEST_LOOPS);
// });
//
// test("simple async count", async () => {
//     testInstance.reset();
//     for (let i = 0; i < NUMBER_OF_NORMAL_TEST_LOOPS; i++) {
//         await testInstance.increaseCount();
//
//     }
//     expect(testInstance.count).toBe(NUMBER_OF_NORMAL_TEST_LOOPS);
// });
//
// test("simple sync count per 10ms", async () => {
//     testInstance.reset();
//     for (let i = 0; i < NUMBER_OF_NORMAL_TEST_LOOPS; i++) {
//         testInstance.increaseCount();
//         await delay(10);
//     }
//     expect(testInstance.count).toBe(NUMBER_OF_NORMAL_TEST_LOOPS);
// });
//
// test("simple async count per 10ms", async () => {
//     testInstance.reset();
//     for (let i = 0; i < NUMBER_OF_NORMAL_TEST_LOOPS; i++) {
//         testInstance.increaseCount();
//         expect(testInstance.count).toBe(i + 1);
//         await delay(10);
//     }
//     expect(testInstance.count).toBe(NUMBER_OF_NORMAL_TEST_LOOPS);
// });
//
// test("1ms delayed count per 10ms", async () => {
//     testInstance.reset();
//     for (let i = 0; i < NUMBER_OF_NORMAL_TEST_LOOPS; i++) {
//         testInstance.increaseCountWithTime(1);
//         await delay(10);
//     }
//     expect(testInstance.count).toBe(NUMBER_OF_NORMAL_TEST_LOOPS);
// });
//
// test("10ms delayed count per 1ms", async () => {
//     testInstance.reset();
//     for (let i = 0; i < NUMBER_OF_NORMAL_TEST_LOOPS; i++) {
//         testInstance.increaseCountWithTime(10);
//         await delay(1);
//     }
//     expect(testInstance.count).toBe(NUMBER_OF_NORMAL_TEST_LOOPS);
// });
