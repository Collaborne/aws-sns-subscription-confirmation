# aws-sns-subscription-confirmation
Express middleware (NodeJS) to handle SNS subscription confirmation

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

// Fix the content type for body-parser
app.use(snsSubscriptionConfirmation.overrideContentType());
app.use(bodyParser.json());
app.use(snsSubscriptionConfirmation.snsConfirmHandler());
```
