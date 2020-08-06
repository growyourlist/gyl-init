const AWS = require('../getAWS')();
const Logger = require('../Logger');

const arraysHaveSameItems = (a = [], b = []) => {
	if (a === b) {
		return true;
	}
	const length = a.length;
	if (length !== b.length) {
		return false;
	}
	const a1 = a.concat().sort();
	const b1 = b.concat().sort();
	for (let index = 0; index < length; index++) {
		if (a1[index] !== b1[index]) {
			return false;
		}
	}
	return true;
};

const definitionsMatch = (def1, def2) => {
	const areMatch =
		arraysHaveSameItems(def1.MatchingEventTypes, def2.MatchingEventTypes) &&
		def1.Enabled === def2.Enabled &&
		def1.SNSDestination.TopicARN === def2.SNSDestination.TopicARN;
	return areMatch;
};

const ensureUpToDate = async (configSet, currentDestinations, eventDef) => {
	const ses = new AWS.SES();
	const currentDef = currentDestinations.find((e) => e.Name === eventDef.Name);
	if (!currentDef) {
		Logger.warn(
			`Did not find current SesEventDestination definition for ${eventDef.Name}. Creating it now`
		);
		await ses
			.createConfigurationSetEventDestination({
				ConfigurationSetName: configSet,
				EventDestination: eventDef,
			})
			.promise();
	} else if (!definitionsMatch(currentDef, eventDef)) {
		Logger.info(`Updating SesEventDestination ${eventDef.Name}`);
		await ses
			.updateConfigurationSetEventDestination({
				ConfigurationSetName: configSet,
				EventDestination: eventDef,
			})
			.promise();
	} else {
		Logger.info(`SesEventDestination ${eventDef.Name} already up to date`);
	}
};

const updateSesEventDestinations = async (params) => {
	const {
		GylSesConfigurationSet,
		GylOpenAndClickTopic,
		GylUnsubscribeEventTopic,
		GylSesFailureEventTopic,
	} = params;
	const ses = new AWS.SES();
	Logger.log('Update SES config...');

	const currentSesConfig = await ses
		.describeConfigurationSet({
			ConfigurationSetName: GylSesConfigurationSet,
			ConfigurationSetAttributeNames: ['eventDestinations'],
		})
		.promise();
	const destinations = currentSesConfig.EventDestinations;

	const openAndClickDef = {
		MatchingEventTypes: ['open', 'click'],
		Name: 'GylOpenAndClickEvent',
		Enabled: true,
		SNSDestination: {
			TopicARN: GylOpenAndClickTopic,
		},
	};

	await ensureUpToDate(GylSesConfigurationSet, destinations, openAndClickDef);

	const bounceAndComplaintDef = {
		MatchingEventTypes: ['bounce', 'complaint'],
		Name: 'GylUnsubscribeEvent',
		Enabled: true,
		SNSDestination: {
			TopicARN: GylUnsubscribeEventTopic,
		},
	};

	await ensureUpToDate(
		GylSesConfigurationSet,
		destinations,
		bounceAndComplaintDef
	);

	const errorNoticeDef = {
		MatchingEventTypes: ['bounce', 'complaint', 'reject', 'renderingFailure'],
		Name: 'GylSesFailureEvent',
		Enabled: true,
		SNSDestination: {
			TopicARN: GylSesFailureEventTopic,
		},
	};

	await ensureUpToDate(GylSesConfigurationSet, destinations, errorNoticeDef);
};

module.exports = updateSesEventDestinations;
