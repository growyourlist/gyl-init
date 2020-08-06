const Logger = require('../Logger');
const AWS = require('../getAWS')();

const updateEnvironmentVars = async (unsubscribeLink) => {
	Logger.info(
		'Updating UNSUBSCRIBE_LINK variable for GylAdminUnsubscribeLinkGet Lambda'
	);
	const lambda = new AWS.Lambda();
	await lambda
		.updateFunctionConfiguration({
			FunctionName: 'GylAdminUnsubscribeLinkGet',
			Environment: {
				Variables: { UNSUBSCRIBE_LINK: unsubscribeLink },
			},
		})
		.promise();
};

module.exports = updateEnvironmentVars;
