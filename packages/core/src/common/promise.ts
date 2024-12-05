type MaybePromise<T> = T | Promise<T>;

/** 异步任务。
 * `fn` 只会执行一次，后续的调用都会返回同一个 Promise。
 */
export class AsyncTask<T> {
  private promise: Promise<T> | null = null;

  execute() {
    // 如果已经有 promise，直接返回
    if (this.promise) {
      return this.promise;
    }

    // 执行函数并处理结果
    try {
      const result = this.fn();

      // 如果返回的已经是 Promise
      if (result instanceof Promise) {
        this.promise = result;
        return result;
      }

      // 如果返回的是普通值，包装成 Promise
      this.promise = Promise.resolve(result);
      return this.promise;
    } catch (error) {
      // 如果函数执行出错，将错误包装成 rejected promise
      this.promise = Promise.reject(error);
      return this.promise;
    }
  }

  constructor(public fn: () => MaybePromise<T>) {}
}
