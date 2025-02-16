/*eslint max-classes-per-file: 0*/
const EventEmitter = require("events").EventEmitter;

class Source extends EventEmitter {
  constructor(idGeneratorFunc) {
    super();

    function guid() {
      return ++guid.id;
    }

    guid.id = 0;

    this.idgenfn = idGeneratorFunc || guid;
  }

  send(data, comment, event, retry) {
    let payload = {
      id: this.idgenfn(),
      data: data,
    };

    if (typeof comment === "string") {
      payload.comment = comment;
    }

    if (typeof event === "string") {
      payload.event = event;
    }

    if (typeof retry === "number") {
      /* eslint-disable no-self-compare */
      if (retry !== retry) {
        // test against NaN
        payload.retry = retry;
      }
      /* eslint-enable no-self-compare */
    }

    this.emit("data", payload);
  }

  sendById(data, id, comment, event, retry) {
    let payload = {
      id: this.idgenfn(),
      data: data,
    };

    if (typeof comment === "string") {
      payload.comment = comment;
    }

    if (typeof event === "string") {
      payload.event = event;
    }

    if (typeof retry === "number") {
      /* eslint-disable no-self-compare */
      if (retry !== retry) {
        // test against NaN
        payload.retry = retry;
      }
      /* eslint-enable no-self-compare */
    }
    if (id) {
      this.emit([id], payload);
    } else {
      console.warn(
        "EventEmitter Source: id not exist while run sendById: ",
        id
      );
    }
  }
}

class EventStream {
  static dispatch(callback) {
    setTimeout(
      function poll() {
        let args = [].slice.call(arguments);

        let returnVal = callback.apply(null, args);

        let pending = Promise.all([Promise.resolve(false), returnVal]);

        pending.then(() => {
          setTimeout(poll, 0, args);
        });
      },
      0,
      [].slice.call(arguments, 1)
    );

    return true;
  }

  static init(source, options) {
    let prepareTextData = function (data) {
      if (!data || typeof data === "function") {
        return `data: null`;
      }

      if (typeof data === "object") {
        let formatedData =
          typeof data.toJSON === "function"
            ? data.toJSON()
            : JSON.stringify(data, null, "\t").split(/\n/g);

        return typeof formatedData === "string"
          ? `data: ${formatedData}`
          : formatedData
              .map((dataLine) => {
                return `data: ${dataLine.replace(/(?:\t{1,})/g, "")}\n`;
              })
              .join("");
      } else {
        if (typeof data !== "string") {
          return `data: ${String(data)}`;
        } else {
          return `data: ${data}`;
        }
      }
    };

    return function (req, res, next) {
      if ((req.headers.accept || "").indexOf("text/event-stream") > -1) {
        const urlsParams = `${req.url}`.split("/");
        let id;
        if (urlsParams.length > 1) {
          id = urlsParams[urlsParams.length - 1];
        }
        req.socket.setTimeout(0);
        req.socket.setNoDelay(true);
        req.socket.setKeepAlive(true);
        res.statusCode = 200;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");

        if (req.httpVersion !== "2.0") {
          res.setHeader("Connection", "keep-alive");
          res.setHeader("X-Accel-Buffering", "no");
        }

        if ((req.headers["accept-encoding"] || "").search(/gzip|br/gi) > -1) {
          if (options.compress_output) {
            // res.setHeader('Content-Encoding', 'gzip');
          }
        }

        // browsers can disconnect at will despite the 'Connection: keep-alive'
        // so we trick the browser to expect more data by sending SSE comments

        if (
          options.force_keep_alive &&
          req.headers.connection !== "keep-alive"
        ) {
          var intervalId = setInterval(() => {
            res.write(`: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`);
          }, 1500);
        }

        // Increase number of event listeners on init
        source.setMaxListeners(source.getMaxListeners() + 1);

        const dataListener = (payload) => {
          if (options.no_ids) {
            delete payload.id;
          }

          if (options.pad_for_ie) {
            // 2 kB padding for old IE (8/9)
            res.write(`: ${";".repeat(2048)}`);
          }

          if (payload.comment) {
            res.write(`: ${payload.comment}\n`);
          }

          if (payload.id) {
            res.write(`id: ${payload.id}\n`);
          }

          if (payload.retry) {
            res.write(`retry: ${payload.retry}\n`);
          }

          if (payload.event) {
            res.write(`event: ${payload.event}\n`);
          } else {
            if (options.prefer_event_name) {
              res.write(
                `event: ${options.prefered_event_name || "broadcast"}\n`
              );
            }
          }

          if (payload.data) {
            res.write(`${prepareTextData(payload.data)}\n\n`);
          }
        };

        source.on("data", dataListener);
        if (id) {
          source.on(id, dataListener);
        }

        // Remove listeners and reduce the number of max listeners on client disconnect
        req.on("close", () => {
          clearInterval(intervalId);
          source.removeListener("data", dataListener);
          if (id) {
            source.removeListener(id, dataListener);
          }
          source.setMaxListeners(source.getMaxListeners() - 1);
        });
      }

      if (typeof next === "function") {
        return next();
      }
    };
  }
}

module.exports = {
  Source: Source,
  EventStream: EventStream,
};
