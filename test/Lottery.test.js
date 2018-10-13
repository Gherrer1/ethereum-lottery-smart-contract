const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-match'))

const provider = ganache.provider();
const web3 = new Web3(provider);

console.log('Compiling...');
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
    it.skip('should add player to players array when enter() transaction is sent if donation >= .01 eth', async () => {
        await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.01', 'ether'), gas: '1000000' });
        let length = await LotteryContract.methods.getNumPlayers().call();
        assert.equal(length, 1);
        let mostRecentlyAddedPlayer = await LotteryContract.methods.players(length - 1).call();
        assert.equal(mostRecentlyAddedPlayer, otherPlayer);

        await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('1', 'ether'), gas: '1000000' });
        length = await LotteryContract.methods.getNumPlayers().call();
        assert.equal(length, 2);
        mostRecentlyAddedPlayer = await LotteryContract.methods.players(length - 1).call();
        assert.equal(mostRecentlyAddedPlayer, otherPlayer);
    });
    it.skip('should not enter player to players if donation < .01 ether', async () => {
        try {
            await LotteryContract.methods.enter().send({ from: otherPlayer, gas: '1000000' });
        } catch(e) {
        
            expect(e.message).to.match(/Must send at least .01 ether/);
            try {
                await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.009999', 'ether'), gas: '1000000' });
            } catch(e) {
                expect(e.message).to.match(/Must send at least .01 ether/);
                return Promise.resolve();
            }

            return Promise.reject('Second transaction should have thrown an error if donation was < .01 ether');
        }

        return Promise.reject('First transaction should have thrown an error if donation was < .01 ether');
    });
    it.skip('should throw error if player who sends pickWinner() is not manager (does not have same address)', async () => {
        try {
            await LotteryContract.methods.pickWinner().send({ from: otherPlayer, gas: '1000000' });
        } catch(e) {
            expect(e.message).to.match(/You must be the manager to do that/);
            return Promise.resolve();
        }

        return Promise.reject('Transaction should have rejected if user isnt manager');
    });
    it('should send winner entire contract balance');
    it('should not change any contract state if player who sends pickWinner() is not manager');
    it('should have balance of 0 after pickWinner() is called by proper manager');
    it('should have empty array of playeres after pickWinner() is called by proper manager');
});