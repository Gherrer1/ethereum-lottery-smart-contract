const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
console.log('compiling...');
const { interface, bytecode } = require('./compile');

// setup Provider which we didnt need to do with Ganache because it does that for us
// we need to do 2 things: provide mnenomic AND designate eth network to connect to
const provider = new HDWalletProvider(
    require('./mnemonic'),
    'https://rinkeby.infura.io/v3/c335065904644478934597d20e2fb60a',
);
const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    const mainAccount = accounts[0];
    console.log(`attempted to deploy from ${mainAccount}`);

    const inboxContract = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: '0x' + bytecode })
        .send({ gas: '1000000', from: mainAccount });
    console.log(`Contract interface: ${interface}`);
    console.log(`Contract deployed to ${inboxContract.options.address}`);
};

deploy();
