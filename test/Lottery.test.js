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
        accounts = await web3.eth.getAccounts();
        mainAccount = accounts[0];
        otherPlayer = accounts[1];
        LotteryContract = await new web3.eth.Contract(JSON.parse(interface))
            .deploy({ data: bytecode, arguments: [] })
            .send({ from: mainAccount, gas: '1000000' });
        LotteryContract.setProvider(provider);
    });

    it('should deploy', () => {
        assert.ok(LotteryContract.options.address);
    });

    describe('construction', () => {
        it('should initialize with manager equal to account who sent transaction', async () => {
            const sender = await LotteryContract.methods.manager().call();
            assert.equal(sender, mainAccount);
        });
        it('should initialize with players array equal to empty array', async () => {
            const length = await LotteryContract.methods.getNumPlayers().call();
            assert.equal(length, 0);
        });
    });

    describe('enter()', () => {
        it('should add player to players array when enter() transaction is sent if donation >= .01 eth', async () => {
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
        it('should not enter player to players if donation < .01 ether', async () => {
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
    });

    describe('pickWinner()', () => {
        it('should throw error if player who sends pickWinner() is not manager (does not have same address)', async () => {
            try {
                await LotteryContract.methods.pickWinner().send({ from: otherPlayer, gas: '1000000' });
            } catch(e) {
                expect(e.message).to.match(/You must be the manager to do that/);
                return Promise.resolve();
            }
    
            return Promise.reject('Transaction should have rejected if user isnt manager');
        });
        it('should throw error if no players have entered yet', async () => {
            try {
                await LotteryContract.methods.pickWinner().send({ from: mainAccount, gas: '1000000' });
            } catch(e) {
                expect(e.message).to.match(/No players have entered yet/);
                return Promise.resolve();
            }

            return Promise.reject('Should have thrown an error');
        });
        it('should have empty array of playeres after pickWinner() is called by proper manager', async () => {
            await LotteryContract.methods.enter().send({ from: otherPlayer, gas: '1000000', value: web3.utils.toWei('.01', 'ether') });
            let numPlayers = await LotteryContract.methods.getNumPlayers().call();
            assert.equal(numPlayers, 1);

            await LotteryContract.methods.pickWinner().send({ from: mainAccount, gas: '1000000' });
            numPlayers = await LotteryContract.methods.getNumPlayers().call();
            assert.equal(numPlayers, 0);
        });
        it('should send winner entire contract balance', async () => {
            // enter other player 3 times
            await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.01', 'ether'), gas: '1000000' });
            await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.01', 'ether'), gas: '1000000' });
            await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.01', 'ether'), gas: '1000000' });

            let balanceBeforeWinning = await web3.eth.getBalance(otherPlayer);
            balanceBeforeWinning = parseInt(balanceBeforeWinning);

            await LotteryContract.methods.pickWinner().send({ from: mainAccount, gas: '1000000' });

            let balanceAfterWinning = await web3.eth.getBalance(otherPlayer);
            balanceAfterWinning = parseInt(balanceAfterWinning);

            const winnings = parseInt(web3.utils.toWei('.03', 'ether'));
            assert.equal(balanceAfterWinning, balanceBeforeWinning + winnings);
        });
        it('should have balance of > 0 before calling pickWinner() and balance of 0 after pickWinner() is called by proper manager', async () => {
            await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.01', 'ether'), gas: '1000000' });
            await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.01', 'ether'), gas: '1000000' });
            await LotteryContract.methods.enter().send({ from: otherPlayer, value: web3.utils.toWei('0.01', 'ether'), gas: '1000000' });

            const contractBalanceBefore = parseInt(await web3.eth.getBalance(LotteryContract.options.address));
            const expectedBalanceBefore = parseInt(web3.utils.toWei('0.03', 'ether'));
            assert.equal(contractBalanceBefore, expectedBalanceBefore);

            await LotteryContract.methods.pickWinner().send({ from: mainAccount, gas: '1000000' });

            const contractBalanceAfter = parseInt(await web3.eth.getBalance(LotteryContract.options.address));
            const expectedBalanceAfter = 0;
            assert.equal(contractBalanceAfter, expectedBalanceAfter);
        });
    });
});