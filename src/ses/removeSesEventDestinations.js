const getAWS = require('../getAWS');

const removeSesEventDestinations = async () => {
	const AWS = getAWS();
	const ses = new AWS.SES();
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
};

module.exports = removeSesEventDestinations;
