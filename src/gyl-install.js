require('dotenv').config()
const cryto = require('crypto')
const bcrypt = require('bcrypt')
const Logger = require('./Logger')
const validateSourceEmail = require('./ses/validateSourceEmail')
const createKeyPair = require('./ec2/createKeyPair')
const uploadLambdaFunctions = require('./s3/uploadLambdaFunctions')
const createCloudFormationStack = require('./cloudformation/createCloudFormationStack')
const createAdminUI = require('./s3/createAdminUI')


// const createUsers = require('./iam/createUsers')
// const createTables = require('./dynamodb/createTables')
// const createCloudFunctions = require('./lambda/createCloudFunctions')

const generateAuthKey = async () => {
	return cryto.randomBytes(24).toString('hex')
}

const generateTablePrefix = async () => {
	// Maybe do random prefixes?
	// const charSource = 'abcdefghijklmnopqrstuvwxyz1234567890'
	// const randomArray = [...Array(3)].map(() => charSource[
	// 	Math.floor(Math.random() * charSource.length)
	// ])
	// randomArray[0] = randomArray[0].toLocaleUpperCase()
	// return `Gyl_${randomArray.join('')}_`
	return `Gyl_`
}

const hash = async input => await bcrypt.hash(input, 10)

const init = async () => {
	try {
		await createKeyPair()
		const SesSourceEmail = await validateSourceEmail()
		const ApiAuthKey = await generateAuthKey()
		const ApiAuthKeyHash = await hash(ApiAuthKey)
		const LambdaBucketName = await uploadLambdaFunctions()
		const DbTablePrefix = await generateTablePrefix()
		await createCloudFormationStack({
			LambdaBucketName, ApiAuthKeyHash, DbTablePrefix, SesSourceEmail
		})
		Logger.log(`GYL API Auth Key: ${ApiAuthKey}`)
		await createAdminUI();

		// await createAdminUI()
		// await createUsers()
		// await createTables()
		// await createCloudFunctions()
	}
	catch (err) {
		console.error(err)
	}
}

init()
