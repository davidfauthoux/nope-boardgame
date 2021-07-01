export class Throttle {
  /**
   * creates a new Throttle
   */
  constructor() {
    let that = this;
    this.throttle = 0.05;

    let toExecute = null;
    let timeoutId = null;
    this._execute = function (f) {
      toExecute = f;
      if (timeoutId === null) {
        timeoutId = setTimeout(function () {
          if (toExecute !== null) {
            toExecute();
            toExecute = null;
          }
          timeoutId = null;
        }, that.throttle * 1000);
      }
    };
  }

  /**
   * executes throttle
   * @param f
   */
  execute(f) {
    this._execute(f);
  }
}
