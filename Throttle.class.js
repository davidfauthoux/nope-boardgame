export class Throttle {
  constructor() {
    var that = this;
    this.throttle = 0.05;

    var toExecute = null;
    var timeoutId = null;
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

  execute(f) {
    this._execute(f);
  }
}
