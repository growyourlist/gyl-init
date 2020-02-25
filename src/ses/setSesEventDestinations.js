const getAWS = require('../getAWS');

const setSesEventDestinations = async params => {
	const {
		GylSesConfigurationSet,
		GylOpenAndClickTopic,
		GylUnsubscribeEventTopic,
		GylSesFailureEventTopic,
	} = params;
	const AWS = getAWS();
	const ses = new AWS.SES();
	await ses.createConfigurationSetEventDestination({
		ConfigurationSetName: GylSesConfigurationSet,
		EventDestination: {
			MatchingEventTypes: ['open', 'click'],
			Name: 'GylOpenAndClickEvent',
			Enabled: true,
			SNSDestination: {
				TopicARN: GylOpenAndClickTopic,
			},
		},
	}).promise();
	await ses.createConfigurationSetEventDestination({
		ConfigurationSetName: GylSesConfigurationSet,
		EventDestination: {
			MatchingEventTypes: ['bounce', 'complaint'],
			Name: 'GylUnsubscribeEvent',
			Enabled: true,
			SNSDestination: {
				TopicARN: GylUnsubscribeEventTopic,
			}
		}
	}).promise();
	await ses.createConfigurationSetEventDestination({
		ConfigurationSetName: GylSesConfigurationSet,
		EventDestination: {
			MatchingEventTypes: ['bounce', 'complaint', 'reject', 'renderingFailure'],
			Name: 'GylSesFailureEvent',
			Enabled: true,
			SNSDestination: {
				TopicARN: GylSesFailureEventTopic,
			}
		}
	}).promise();
};

module.exports = setSesEventDestinations;
