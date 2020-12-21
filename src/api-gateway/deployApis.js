const AWS = require('../getAWS')();

const apiGateway = new AWS.APIGateway()

const deployApi = async (apiInfo) => {
	const { restApiId, stageName } = apiInfo;
	await apiGateway.createDeployment({
		restApiId,
		stageName,
	}).promise()
}

const deployApis = async (apiInfos) => {
	for (let i = 0; i < apiInfos.length; i++) {
		const apiInfo = apiInfos[i];
		await deployApi(apiInfo);
	}
}

module.exports = deployApis;
