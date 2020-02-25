const { GylEc2MainKeyName } = require('../common/resourceNames');
const Logger = require('../Logger');
const getAWS = require('../getAWS');

const deleteKeyPair = async () => {
	const AWS = getAWS();
	const ec2 = new AWS.EC2();
	const KeyName = GylEc2MainKeyName;
	Logger.info(`Deleting key pair ${KeyName}`);
	await ec2.deleteKeyPair({ KeyName }).promise();
	Logger.info(`Key pair ${KeyName} deleted`);
};

module.exports = deleteKeyPair;
