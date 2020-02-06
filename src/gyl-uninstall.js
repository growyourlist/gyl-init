// const deleteTables = require('./dynamodb/deleteTables')
// const removeUsers = require('./iam/deleteUsers')

const deleteAdminUI = require("./s3/deleteAdminUI");
const deleteCloudFormationStack = require("./cloudformation/deleteCloudFormationStack");
const deleteKeyPair = require('./ec2/deleteKeyPair')
const deleteLambdaFunctions = require('./s3/deleteLambdaFunctions')
const removeSourceEmail = require('./ses/removeSourceEmail')
const Logger = require("./Logger");

const uninstall = async () => {
  try {
    // await deleteTables()
    // await removeUsers()
    // await deleteCloudFunctions()
    // await deleteAdminUI();

    await deleteAdminUI();
    await deleteCloudFormationStack();
    await deleteKeyPair();
    await deleteLambdaFunctions();
    await removeSourceEmail();
  } catch (err) {
    Logger.error(err);
  }
};

uninstall();
