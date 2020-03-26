const getAWS = require('../getAWS');

const removeSesEventDestinations = async () => {
	const AWS = getAWS();
	const ses = new AWS.SES();
	try {
		await ses.deleteConfigurationSetEventDestination({
			ConfigurationSetName: 'GylSesConfigurationSet',
			EventDestinationName: 'GylOpenAndClickEvent'
		}).promise()
		await ses.deleteConfigurationSetEventDestination({
			ConfigurationSetName: 'GylSesConfigurationSet',
			EventDestinationName: 'GylUnsubscribeEvent'
		}).promise()
		await ses.deleteConfigurationSetEventDestination({
			ConfigurationSetName: 'GylSesConfigurationSet',
			EventDestinationName: 'GylSesFailureEvent'
		}).promise()
	} catch (err) {
		if (err.code !== 'ConfigurationSetDoesNotExist') {
			throw err;
		}
	}
};

module.exports = removeSesEventDestinations;
