const getAWS = require('../getAWS')

const setEnvironmentVars = async (opts) => {
	const publicApiUrl = `${opts.publicApiUrl}/`
	const unsubscribeLink = `${publicApiUrl}subscriber/unsubscribe?id={{subscriberId}}`;
	const AWS = getAWS();
	const lambda = new AWS.Lambda();
	await lambda.updateFunctionConfiguration({
		FunctionName: 'GylAdminUnsubscribeLinkGet',
		Environment: {
			Variables: { UNSUBSCRIBE_LINK: unsubscribeLink }
		}
	}).promise()
	const existingSubscriberPost = await lambda.getFunctionConfiguration({
		FunctionName: 'GylAdminSubscriberPost',
	}).promise();
	const Environment = Object.assign({}, 
		(existingSubscriberPost.Environment || {}),
		{ API: publicApiUrl }
	);
	await lambda.updateFunctionConfiguration({
		FunctionName: 'GylAdminSubscriberPost',
		Environment
	}).promise()
}

module.exports = setEnvironmentVars;
