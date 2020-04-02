const { GylMainEc2KeyName } = require('../common/resourceNames');
const Logger = require('../Logger');
const getAWS = require('../getAWS');

const deleteKeyPair = async () => {
	const AWS = getAWS();
	const ec2 = new AWS.EC2();
	const GylKeyName = GylMainEc2KeyName;
	Logger.info(`Deleting key pair ${GylKeyName}`);
	await ec2.deleteKeyPair({ KeyName: GylKeyName }).promise();
	Logger.info(`Key pair ${GylKeyName} deleted`);
};

module.exports = deleteKeyPair;
