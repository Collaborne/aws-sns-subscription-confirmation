'use strict';

const expect = require('chai').expect;
const httpMocks = require('express-mocks-http');
const nock = require('nock');

const snsSubscriptionNotification = require('..');

nock.disableNetConnect();

describe('aws-sns-subscription-notification', function() {
	let req, res;

	beforeEach(function() {
		req = httpMocks.createExpressRequest();
		res = httpMocks.createExpressResponse();
	});

	describe('#overrideContentType', function() {
		const handler = snsSubscriptionNotification.overrideContentType();

		it('should invoke next for unknown requests', function(done) {
			return handler(req, res, () => {
				expect(true).to.be.true;
				return done();
			});
		});

		it('should set the content type for AWS "Notification" requests', function(done) {
			req.headers['x-amz-sns-message-type'] = 'Notification';
			return handler(req, res, () => {
				expect(req.headers['content-type']).to.include('application/json');
				return done();
			});
		});
	});

	describe('#snsConfirmHandler', function() {
		const handler = snsSubscriptionNotification.snsConfirmHandler();

		it('should invoke next for unknown requests', function(done) {
			return handler(req, res, () => {
				expect(true).to.be.true;
				return done();
			});
		});

		it('should request the confirm URL from the body', function() {
			const subscribeUrl = 'http://example.com/confirm';

			const scope = nock('http://example.com')
				.get('/confirm')
				.reply(200, '<ConfirmSubscriptionResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/"><ConfirmSubscriptionResult><SubscriptionArn>arn:aws:sns:us-west-2:123456789012:MyTopic:2bcfbf39-05c3-41de-beaa-fcfcc21c8f55</SubscriptionArn></ConfirmSubscriptionResult><ResponseMetadata><RequestId>075ecce8-8dac-11e1-bf80-f781d96e9307</RequestId></ResponseMetadata></ConfirmSubscriptionResponse>');

			req.headers['x-amz-sns-message-type'] = 'SubscriptionConfirmation';
			req.body = {
				'SubscribeURL': subscribeUrl
			};
			const send = res.send;
			res.send = function(/* arguments */) {
				expect(scope.isDone()).to.be.true;
				expect(res.subscriptionArn).to.be.equal('arn:aws:sns:us-west-2:123456789012:MyTopic:2bcfbf39-05c3-41de-beaa-fcfcc21c8f55');

				return send.apply(res, arguments);
			};

			handler(req, res, () => {
				expect(false, 'Should not call next()').to.be.true;
			});

		});
	});
});