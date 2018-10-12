const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');

describe('Lottery Contract', () => {
    let mainAccount;
    let otherPlayer;
    let LotteryContract;
    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        mainAccount = accounts[0];
        otherPlayer = accounts[1];
        LotteryContract = await new web3.eth.Contract(JSON.parse(interface))
            .deploy({ data: bytecode, arguments: [] })
            .send({ from: mainAccount, gas: '1000000' });
        LotteryContract.setProvider(provider);
    });

    it('should initialize with manager equal to account who sent transaction', async () => {
        const sender = await LotteryContract.methods.manager().call();
        assert.equal(sender, mainAccount);
    });
    it('should initialize with players array equal to empty array', async () => {
        const length = await LotteryContract.methods.getNumPlayers().call();
        assert.equal(length, 0);
    });
    it('should add player to players array when enter() transaction is sent if donation >= 1 wei', async () => {
        await LotteryContract.methods.enter().send({ from: otherPlayer, value: 1, gas: '1000000' });
        let length = await LotteryContract.methods.getNumPlayers().call();
        assert.equal(length, 1);

        await LotteryContract.methods.enter().send({ from: otherPlayer, value: 100, gas: '1000000' });
        length = await LotteryContract.methods.getNumPlayers().call();
        assert.equal(length, 2);
    });
    it('should not enter player to players if donation < 1 wei', async () => {
        await LotteryContract.methods.enter().send({ from: otherPlayer, gas: '1000000' });
        let length = await LotteryContract.methods.getNumPlayers().call();
        assert.equal(length, 0);

        await LotteryContract.methods.enter().send({ from: otherPlayer, gas: '1000000', value: 0 })
        length = await LotteryContract.methods.getNumPlayers().call();
        assert.equal(length, 0);
    });
    it('should randomly pick a winner when pickWinner() transaction is sent');
    it('should not pick winner if player who sends pickWinner() is not manager (does not have same address)');
    it('should have balance of 0 after pickWinner is called by proper manager');
});