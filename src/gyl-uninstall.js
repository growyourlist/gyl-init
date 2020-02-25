const loadConfig = require('./loadConfig');
const deleteAdminUI = require("./s3/deleteAdminUI");
const deleteCloudFormationStack = require("./cloudformation/deleteCloudFormationStack");
const deleteKeyPair = require('./ec2/deleteKeyPair')
const deleteLambdaFunctions = require('./s3/deleteLambdaFunctions')
const removeSourceEmail = require('./ses/removeSourceEmail')
const removeUsers = require('./iam/deleteUsers')
const removeSesEventDestinations = require('./ses/removeSesEventDestinations')
const Logger = require("./Logger");

const uninstall = async () => {
  try {
    await loadConfig();
    await deleteAdminUI();
    await removeSesEventDestinations();
    await deleteCloudFormationStack();
    await deleteKeyPair();
    await deleteLambdaFunctions();
    await removeSourceEmail();
    await removeUsers();
  } catch (err) {
    Logger.error(err);
  }
};

module.exports = uninstall;
