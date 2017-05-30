'use strict';

const debug = require('debug')('aws-sns-subscription-notification');

const xml2js = require('xml2js');
const request = require('request');

/**
 * SNS sends the wrong content-type for subscription confirmations. This is
 * a known issue that AWS won't fix to not break existing integrations.
 * @see https://forums.aws.amazon.com/message.jspa?messageID=261061#262098
 */
function overrideContentType() {
	return (req, res, next) => {
		if (req.headers['x-amz-sns-message-type']) {
			req.headers['content-type'] = 'application/json;charset=UTF-8';
		}

		return next();
	};
}

/**
 * Middleware to handle SNS subscription confirmations
 *
 * @returns
 */
function snsConfirmHandler() {
	return (req, res, next) => {
		// Handle call for SNS confirmation
		// @see http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html
		if (req.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
			const subscribeUrl = req.body.SubscribeURL;
			debug(`Received SubscriptionConfirmation request: ${subscribeUrl}`);

			return request({ uri: subscribeUrl }, (err, response, body) => {
				if (err) {
					return res.status(400).send({error: err.message});
				}

				// Parse the response and extract the subscription ARN
				const parser = new xml2js.Parser();
				return parser.parseString(body, function callback(err, doc) {
					if (err) {
						return res.status(400).send({error: err.message});
					}

					let subscriptionArn;
					try {
						subscriptionArn = doc.ConfirmSubscriptionResponse.ConfirmSubscriptionResult[0].SubscriptionArn[0];
						if (!subscriptionArn) {
							return res.status(400).send({ error: 'Cannot find SubscriptionArn' });
						}
						debug(`Subscription: ${subscriptionArn}`);
					} catch (e) {
						// Ignore errors related to accessing the value
						return res.status(400).send({ error: 'Cannot find SubscriptionArn' });
					}

					// Retain the subscription ARN on the request for testing
					res.subscriptionArn = subscriptionArn;
					return res.send('Subscribed');
				});
			});
		} else {
			return next();
		}
	};
}

module.exports = {
	overrideContentType,
	snsConfirmHandler,
};
