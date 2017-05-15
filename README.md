# aws-sns-subscription-confirmation
Express middleware (NodeJS) to respond to [SNS subscription confirmations](http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html).

## Usage

Install the library:

```bash
npm install aws-sns-subscription-confirmation
```

Use the library in your express application:

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const snsSubscriptionConfirmation = require('aws-sns-subscription-confirmation');

const app = express();

// Fix the wrong request content-type as required by the body-parser
app.use(snsSubscriptionConfirmation.overrideContentType());
app.use(bodyParser.json());
app.use(snsSubscriptionConfirmation.snsConfirmHandler());
```
