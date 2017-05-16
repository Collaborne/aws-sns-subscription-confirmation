'use strict';

const libxmljs = require('libxmljs-mt');
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
 * The logger used for sending debug/information messages.
 *
 * @typedef Logger
 * @property {Function} info
 * @property {Function} debug
 */

/**
 * Middleware to handle SNS subscription confirmations
 *
 * @param {Logger} [logger=console]
 * @returns
 */
function snsConfirmHandler(logger = console) {
	return (req, res, next) => {
		// Handle call for SNS confirmation
		// @see http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html
		if (req.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
			const subscribeUrl = req.body.SubscribeURL;
			logger.debug(`Received SubscriptionConfirmation request: ${subscribeUrl}`);

			return request({ uri: subscribeUrl }, (err, response, body) => {
				if (err) {
					return res.status(400).send({error: err.message});
				}

				// Parse the response and extract the subscription ARN
				return libxmljs.Document.fromXmlAsync(body, function callback(err, doc) {
					if (err) {
						return res.status(400).send({error: err.message});
					}

					const subscriptionArnNode = doc.get('//aws:ConfirmSubscriptionResult/aws:SubscriptionArn', { aws: 'http://sns.amazonaws.com/doc/2010-03-31/'});
					if (!subscriptionArnNode) {
						return res.status(400).send({error: 'Cannot find SubscriptionArn node'});
					}

					const subscriptionArn = subscriptionArnNode.text();

					logger.info(`Subscription: ${subscriptionArn}`);
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
