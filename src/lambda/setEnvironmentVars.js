const getAWS = require('../getAWS')

const setEnvironmentVars = async (unsubscribeLink) => {
	const AWS = getAWS();
	const lambda = new AWS.Lambda();
	await lambda.updateFunctionConfiguration({
		FunctionName: 'GylAdminUnsubscribeLinkGet',
		Environment: {
			Variables: { UNSUBSCRIBE_LINK: unsubscribeLink }
		}
	}).promise()
}

module.exports = setEnvironmentVars;
