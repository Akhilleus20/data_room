const { deployTestSDK } = require('./tests/dataroom/test_sdk');
const { deployDataRoom, testDataRoom } = require('./tests/dataroom/test_suite');

const deployApp = true;
const doNotDeployApp = false;

const runTests = async () => {
  // await deployTestSDK();
  // await deployDataRoom();
  await testDataRoom();

};

runTests();
