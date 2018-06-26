const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require("../compile");

let lottery, accounts;

beforeEach(async () =>{
    accounts = await web3.eth.getAccounts();

    // console.log(accounts);

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data:bytecode })
        .send({ from: accounts[0], gas: "1000000" });

    // console.log(lottery);
});

describe("Lottery Contract", ()=>{
    it("should succefully deployed the contract ", ()=>{
        assert.ok(lottery.options.address);
    });

    it("Should allow one account to enter", async ()=>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("0.02", "ether"),
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    })

    it("Should allow multiple account to enter", async ()=>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("0.02", "ether"),
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether"),
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei("0.03", "ether"),
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    })

    it("require least 0.01 Ether to enter in the lottery", async ()=>{
        try{
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 0
            });
            assert(false);
        }catch(err){
            assert(err);
        }
    });

    it("should only allow the managers to call pickwinner", async ()=>{
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[1],
            });
            assert(false);
        }catch(err){
            assert(err);
        }
    });

    it("should send money to the winner and reset the players array", async ()=>{
        const tx = await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("1", "ether")
        });


        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });

        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei("0.8", "ether"));
    });

});