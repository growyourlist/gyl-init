const getAWS = require('../getAWS');
const getDynamoDbPrefix = require('../dynamodb/getDynamoDbPrefix');
const Logger = require('../Logger');

const getCurrentSesSourceEmail = async () => {
	const AWS = getAWS();
	const dyanmodb = new AWS.DynamoDB.DocumentClient();
	const dbTablePrefix = await getDynamoDbPrefix();
	const currentLists = await dyanmodb
		.get({
			TableName: `${dbTablePrefix}Settings`,
			Key: {
				settingName: 'lists',
			},
		})
		.promise();

	if (!Array.isArray(currentLists.Item && currentLists.Item.value)) {
		throw new Error('List settings do not exist in DyanmoDB');
	}
	const defaultList = currentLists.Item.value.find(
		(i) => i.id === 'list-default'
	);
	if (!defaultList || typeof defaultList.sourceEmail !== 'string') {
		throw new Error('Default list is not set');
	}

	return defaultList.sourceEmail;
};

module.exports = getCurrentSesSourceEmail;
