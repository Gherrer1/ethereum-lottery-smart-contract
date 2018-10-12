const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');

describe('Lottery Contract', () => {
    let mainAccount;
    let LotteryContract;
    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        mainAccount = accounts[0];
        LotteryContract = await new web3.eth.Contract(JSON.parse(interface))
            .deploy({ data: bytecode, arguments: [] })
            .send({ from: mainAccount, gas: '1000000' });
        LotteryContract.setProvider(provider);
    });

    it('should initialize with manager equal to account who sent transaction', async () => {
        const sender = await LotteryContract.methods.manager().call();
        assert.equal(sender, mainAccount);
    });
    it('should initialize with players array equal to empty array ([0 address, 0 address])', async () => {
        // you need to pass in index of player you want from the array;
        const player1Address = await LotteryContract.methods.players(0).call();
        const player2Address = await LotteryContract.methods.players(1).call();
        assert.equal(player1Address, '0x0000000000000000000000000000000000000000');
        assert.equal(player2Address, '0x0000000000000000000000000000000000000000');
    });
    it('should add player to players array when enter() transaction is sent');
    it('should not enter player to players if donation < 1 eth');
    it('should randomly pick a winner when pickWinner() transaction is sent');
    it('should not pick winner if player who sends pickWinner() is not manager (does not have same address)');
});