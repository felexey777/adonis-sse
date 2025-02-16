# adonis-sse

An addon/plugin package to provide server-sent events functionality for AdonisJS 4.0+

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]

<img src="http://res.cloudinary.com/adonisjs/image/upload/q_100/v1497112678/adonis-purple_pzkmzt.svg" width="200px" align="right" hspace="30px" vspace="140px">

## Getting Started

```bash

    adonis install adonisjs-sse

```

## Usage

> Firstly, follow the instructions in `instructions.md` file to setup the _Provider_ and _Middleware_

See the [_instructions.md_](https://github.com/stitchng/adonis-sse/blob/master/instructions.md) file for the complete installation steps and follow as stated.

### Registering provider

Like any other provider, you need to register the provider inside `start/app.js` file.

```js
const providers = [..."adonisjs-sse/providers/ServerSentEventsProvider"];
```

### Registering middleware

Register the following middleware inside `start/kernel.js` file.

> You can optionally place the sse middleware after the 'Adonis/Middleware/AuthInit' middleware

```js
const globalMiddleware = [
  ..."Adonis/Middleware/AuthInit",
  "Adonis/Middleware/EventSourceWatcher",
];
```

> Or alternatively setup the middleware as a named (use any name you feel like) middleware inside `start/kernel.js` file.

```js
const namedMiddleware = {
  eventsource: "Adonis/Middleware/EventSourceWatcher",
};
```

_HINT: It would be much easier and better to make the `EventSourceWatcher` middleware a global middleware_

> Setup serve-sent events route inside `start/routes.js` file.

```js
/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

/**
 * If the 'eventsource' named middleware is set
 * then setup route like below
 */
Route.get("/stream", ({ source }) => {
  // send a server-sent events comment to all listeners
  source.send("Hello AdonisJS", "!This is a comment!");
}).middleware(["eventsource"]);

/**
 * If the middleware is a global middlware
 * then setup route like below
 */
Route.get("/stream", ({ source }) => {
  // send a server-sent events comment to all listeners
  source.send("Hello AdonisJS", "!This is a comment!");
});

/**
 * If the middleware is a global middlware
 * then setup route like below
 */
Route.get("/echo/id", ({ source }) => {
  // send a server-sent events comment to specific user
  source.sendById("Hello AdonisJS", "!This is a comment!", "id");
});

Route.post("/send/email", "NotificationsController.sendEmail");
```

## Example(s)

> Setup a controller to dispatch server-sent events to the browser using the `source.send(data: Object, comment: String, event: String, retry: Number)` method like so:

```js
/** @type {typeof import('@adonisjs/mail/src/Mail')} */
const Mail = use("Mail");

class NotificationsController {
  async sendEmail({ request, auth, source }) {
    let input = request.only(["ticket_user_id"]);

    let { id, email, fullname } = await auth.getUser();
    let error = false;

    try {
      await Mail.send("emails.template", { fullname }, (message) => {
        message.to(email);
        message.from("crm.tickets@funsignals.co");
        message.subject("Ticket Creation Job Status");
      });
    } catch (err) {
      error = true;
    } finally {
      source.send(
        {
          ticket_reciever: id,
          ticket_creator: input.ticket_user_id,
          ticket_mail_status: `email sent ${error ? "un" : ""}successfuly`,
        },
        null,
        "update",
        4000
      ); // event: 'update', retry: 4000 (4 seconds)
    }
  }
}

module.exports = NotificationsController;
```

```typescript

/**
 * source.send (METHOD)
 */

send( data: object, comment: string, event: string, retry: number );

/**
 * source.sendById (METHOD)
 */
sendById( data: object, id: string, comment: string, event: string, retry: number );

```

## Connecting from the client-side

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <!-- Polyfill for older browsers without native support for the HTML5 EventSource API. -->
    <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=EventSource"></script>
  </head>
  <body>
    <script id="server-side-events" type="text/javascript">
      const stream = new EventSource("http://127.0.0.1:3333/stream");

      stream.addEventListener(
        "message",
        function (e) {
          console.log("Data: ", e.data);
        },
        false
      );

      stream.addEventListener(
        "open",
        function (e) {
          // Connection was opened.
          console.log("connection open: true");
        },
        false
      );

      stream.addEventListener(
        "error",
        function (e) {
          if (e.readyState == EventSource.CLOSED) {
            // Connection was closed.
            console.log("connection closed: true");
          }
        },
        false
      );
    </script>
  </body>
</html>
```

## License

MIT

## Running Tests

```bash

    npm i

```

```bash

    npm run lint

    npm run test

```

## Credits

- [Ifeora Okechukwu](https://twitter.com/isocroft)

## Contributing

See the [CONTRIBUTING.md](https://github.com/stitchng/adonis-sse/blob/master/CONTRIBUTING.md) file for info

[npm-image]: https://img.shields.io/npm/v/adonisjs-sse.svg?style=flat-square
[npm-url]: https://npmjs.org/package/adonisjs-sse
[travis-image]: https://img.shields.io/travis/stitchng/adonis-sse/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/stitchng/adonis-sse
[coveralls-image]: https://img.shields.io/coveralls/stitchng/adonis-sse/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/stitchng/adonis-sse

## Support

**Coolcodes** is a non-profit software foundation (collective) created by **Oparand** - parent company of StitchNG, Synergixe based in Abuja, Nigeria. You'll find an overview of all our work and supported open source projects on our [Facebook Page](https://www.facebook.com/coolcodes/).

> Follow us on facebook if you can to get the latest open source software/freeware news and infomation.

Does your business depend on our open projects? Reach out and support us on [Patreon](https://www.patreon.com/coolcodes/). All pledges will be dedicated to allocating workforce on maintenance and new awesome stuff.
