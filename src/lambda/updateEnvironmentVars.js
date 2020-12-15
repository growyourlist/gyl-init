const Logger = require('../Logger');
const AWS = require('../getAWS')();

const updateEnvironmentVars = async (varData = {}) => {
	Logger.info(
		'Updating UNSUBSCRIBE_LINK variable for GylAdminUnsubscribeLinkGet Lambda'
	);
	const lambda = new AWS.Lambda();
	await lambda
		.updateFunctionConfiguration({
			FunctionName: 'GylAdminUnsubscribeLinkGet',
			Environment: {
				Variables: {
					UNSUBSCRIBE_LINK: `${varData.publicApiUrl}/subscriber/unsubscribe?id={{subscriberId}}`
				},
			},
		})
		.promise();
};

module.exports = updateEnvironmentVars;
