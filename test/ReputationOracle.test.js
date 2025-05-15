const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("ReputationOracle", function () {
  let reputationOracle;
  let owner;
  let oracle;
  let user1;
  let user2;
  
  const githubUsername1 = "dev-user1";
  const githubUsername2 = "dev-user2";
  const nonExistentUsername = "non-existent-user";
  
  beforeEach(async function () {
    // Get signers
    [owner, oracle, user1, user2] = await ethers.getSigners();
    
    // Deploy ReputationOracle
    const ReputationOracle = await ethers.getContractFactory("ReputationOracle");
    reputationOracle = await ReputationOracle.deploy();
    
    // Owner authorizes an oracle
    await reputationOracle.authorizeOracle(oracle.address);
  });
  
  describe("Constructor", function () {
    it("Should set the deployer as owner", async function () {
      expect(await reputationOracle.owner()).to.equal(owner.address);
    });
    
    it("Should set the owner as an authorized oracle", async function () {
      expect(await reputationOracle.isOracle(owner.address)).to.equal(true);
    });
  });
  
  describe("Oracle Management", function () {
    describe("authorizeOracle", function () {
      it("Should authorize a new oracle", async function () {
        await reputationOracle.authorizeOracle(user1.address);
        expect(await reputationOracle.isOracle(user1.address)).to.equal(true);
      });
      
      it("Should emit OracleAuthorized event", async function () {
        await expect(reputationOracle.authorizeOracle(user1.address))
          .to.emit(reputationOracle, "OracleAuthorized")
          .withArgs(user1.address);
      });
      
      it("Should revert if caller is not owner", async function () {
        await expect(reputationOracle.connect(user1).authorizeOracle(user2.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
      
      it("Should revert if oracle address is zero", async function () {
        await expect(reputationOracle.authorizeOracle(ethers.ZeroAddress))
          .to.be.revertedWith("ReputationOracle: oracle address cannot be zero");
      });
      
      it("Should revert if oracle is already authorized", async function () {
        await reputationOracle.authorizeOracle(user1.address);
        await expect(reputationOracle.authorizeOracle(user1.address))
          .to.be.revertedWith("ReputationOracle: oracle already authorized");
      });
    });
    
    describe("revokeOracle", function () {
      beforeEach(async function () {
        // Authorize user1 as an oracle
        await reputationOracle.authorizeOracle(user1.address);
      });
      
      it("Should revoke an oracle", async function () {
        await reputationOracle.revokeOracle(user1.address);
        expect(await reputationOracle.isOracle(user1.address)).to.equal(false);
      });
      
      it("Should emit OracleRevoked event", async function () {
        await expect(reputationOracle.revokeOracle(user1.address))
          .to.emit(reputationOracle, "OracleRevoked")
          .withArgs(user1.address);
      });
      
      it("Should revert if caller is not owner", async function () {
        await expect(reputationOracle.connect(user1).revokeOracle(oracle.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
      
      it("Should revert if oracle is not authorized", async function () {
        await expect(reputationOracle.revokeOracle(user2.address))
          .to.be.revertedWith("ReputationOracle: oracle not authorized");
      });
      
      it("Should revert if trying to revoke owner", async function () {
        await expect(reputationOracle.revokeOracle(owner.address))
          .to.be.revertedWith("ReputationOracle: cannot revoke owner as oracle");
      });
    });
    
    describe("isOracle", function () {
      it("Should return true for authorized oracles", async function () {
        expect(await reputationOracle.isOracle(owner.address)).to.equal(true);
        expect(await reputationOracle.isOracle(oracle.address)).to.equal(true);
      });
      
      it("Should return false for non-oracles", async function () {
        expect(await reputationOracle.isOracle(user1.address)).to.equal(false);
        expect(await reputationOracle.isOracle(user2.address)).to.equal(false);
      });
    });
  });
  
  describe("Score Management", function () {
    describe("updateScore", function () {
      it("Should update a score correctly", async function () {
        const score = 75;
        await reputationOracle.connect(oracle).updateScore(githubUsername1, score);
        
        const result = await reputationOracle.getScoreByGithub(githubUsername1);
        expect(result[0]).to.equal(score); // score
      });
      
      it("Should emit ScoreUpdated event", async function () {
        const score = 75;
        await expect(reputationOracle.connect(oracle).updateScore(githubUsername1, score))
          .to.emit(reputationOracle, "ScoreUpdated")
          .withArgs(githubUsername1, score, await getBlockTimestamp());
      });
      
      it("Should update timestamp", async function () {
        const score = 75;
        await reputationOracle.connect(oracle).updateScore(githubUsername1, score);
        
        const result = await reputationOracle.getScoreByGithub(githubUsername1);
        expect(result[1]).to.be.closeTo(await getBlockTimestamp(), 5); // timestamp
      });
      
      it("Should revert if caller is not an oracle", async function () {
        await expect(reputationOracle.connect(user1).updateScore(githubUsername1, 75))
          .to.be.revertedWith("ReputationOracle: caller is not an authorized oracle");
      });
      
      it("Should revert if github username is empty", async function () {
        await expect(reputationOracle.connect(oracle).updateScore("", 75))
          .to.be.revertedWith("ReputationOracle: github username cannot be empty");
      });
      
      it("Should allow overwriting existing scores", async function () {
        await reputationOracle.connect(oracle).updateScore(githubUsername1, 75);
        await reputationOracle.connect(oracle).updateScore(githubUsername1, 80);
        
        const result = await reputationOracle.getScoreByGithub(githubUsername1);
        expect(result[0]).to.equal(80); // score
      });
    });
    
    describe("batchUpdateScores", function () {
      it("Should update multiple scores correctly", async function () {
        const usernames = [githubUsername1, githubUsername2];
        const scores = [75, 85];
        
        await reputationOracle.connect(oracle).batchUpdateScores(usernames, scores);
        
        const result1 = await reputationOracle.getScoreByGithub(githubUsername1);
        const result2 = await reputationOracle.getScoreByGithub(githubUsername2);
        
        expect(result1[0]).to.equal(75); // score for username1
        expect(result2[0]).to.equal(85); // score for username2
      });
      
      it("Should emit ScoreUpdated events for each update", async function () {
        const usernames = [githubUsername1, githubUsername2];
        const scores = [75, 85];
        
        const tx = await reputationOracle.connect(oracle).batchUpdateScores(usernames, scores);
        const receipt = await tx.wait();
        
        // Filter events of type ScoreUpdated
        const events = receipt.logs.filter(log => {
          try {
            const parsed = reputationOracle.interface.parseLog(log);
            return parsed && parsed.name === 'ScoreUpdated';
          } catch (e) {
            return false;
          }
        });
        
        expect(events.length).to.equal(2);
      });
      
      it("Should revert if arrays length mismatch", async function () {
        const usernames = [githubUsername1, githubUsername2];
        const scores = [75];
        
        await expect(reputationOracle.connect(oracle).batchUpdateScores(usernames, scores))
          .to.be.revertedWith("ReputationOracle: arrays length mismatch");
      });
      
      it("Should revert if caller is not an oracle", async function () {
        const usernames = [githubUsername1, githubUsername2];
        const scores = [75, 85];
        
        await expect(reputationOracle.connect(user1).batchUpdateScores(usernames, scores))
          .to.be.revertedWith("ReputationOracle: caller is not an authorized oracle");
      });
      
      it("Should revert if any username is empty", async function () {
        const usernames = [githubUsername1, ""];
        const scores = [75, 85];
        
        await expect(reputationOracle.connect(oracle).batchUpdateScores(usernames, scores))
          .to.be.revertedWith("ReputationOracle: github username cannot be empty");
      });
    });
    
    describe("getScoreByGithub", function () {
      it("Should return 0 for non-existent username", async function () {
        const result = await reputationOracle.getScoreByGithub(nonExistentUsername);
        expect(result[0]).to.equal(0); // score
        expect(result[1]).to.equal(0); // timestamp
      });
      
      it("Should return correct score for existing username", async function () {
        await reputationOracle.connect(oracle).updateScore(githubUsername1, 75);
        
        const result = await reputationOracle.getScoreByGithub(githubUsername1);
        expect(result[0]).to.equal(75); // score
      });
    });
    
    describe("hasReputationByGithub", function () {
      beforeEach(async function () {
        // Set minimum reputation to 50
        await reputationOracle.updateMinimumScore(50);
        
        // Set scores
        await reputationOracle.connect(oracle).updateScore(githubUsername1, 75); // Above minimum
        await reputationOracle.connect(oracle).updateScore(githubUsername2, 40); // Below minimum
      });
      
      it("Should return true if score is above minimum", async function () {
        expect(await reputationOracle.hasReputationByGithub(githubUsername1)).to.equal(true);
      });
      
      it("Should return false if score is below minimum", async function () {
        expect(await reputationOracle.hasReputationByGithub(githubUsername2)).to.equal(false);
      });
      
      it("Should return false for non-existent username", async function () {
        expect(await reputationOracle.hasReputationByGithub(nonExistentUsername)).to.equal(false);
      });
    });
  });
  
  describe("GitHub Account Linking", function () {
    describe("linkGithubAccount", function () {
      it("Should link GitHub account correctly (by owner)", async function () {
        await reputationOracle.linkGithubAccount(user1.address, githubUsername1);
        
        expect(await reputationOracle.getGithubUsername(user1.address)).to.equal(githubUsername1);
        expect(await reputationOracle.getAddress(githubUsername1)).to.equal(user1.address);
      });
      
      it("Should emit GithubAccountLinked event", async function () {
        await expect(reputationOracle.linkGithubAccount(user1.address, githubUsername1))
          .to.emit(reputationOracle, "GithubAccountLinked")
          .withArgs(user1.address, githubUsername1);
      });
      
      it("Should revert if user address is zero", async function () {
        await expect(reputationOracle.linkGithubAccount(ethers.ZeroAddress, githubUsername1))
          .to.be.revertedWith("ReputationOracle: user address cannot be zero");
      });
      
      it("Should revert if github username is empty", async function () {
        await expect(reputationOracle.linkGithubAccount(user1.address, ""))
          .to.be.revertedWith("ReputationOracle: github username cannot be empty");
      });
      
      it("Should revert if address already linked", async function () {
        await reputationOracle.linkGithubAccount(user1.address, githubUsername1);
        await expect(reputationOracle.linkGithubAccount(user1.address, githubUsername2))
          .to.be.revertedWith("ReputationOracle: address already linked");
      });
      
      it("Should revert if github username already linked", async function () {
        await reputationOracle.linkGithubAccount(user1.address, githubUsername1);
        await expect(reputationOracle.linkGithubAccount(user2.address, githubUsername1))
          .to.be.revertedWith("ReputationOracle: github username already linked");
      });
      
      it("Should revert if caller is not owner", async function () {
        await expect(reputationOracle.connect(user1).linkGithubAccount(user1.address, githubUsername1))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
    
    describe("linkMyGithubAccount", function () {
      it("Should allow user to link their own GitHub account", async function () {
        await reputationOracle.connect(user1).linkMyGithubAccount(githubUsername1);
        
        expect(await reputationOracle.getGithubUsername(user1.address)).to.equal(githubUsername1);
        expect(await reputationOracle.getAddress(githubUsername1)).to.equal(user1.address);
      });
      
      it("Should emit GithubAccountLinked event", async function () {
        await expect(reputationOracle.connect(user1).linkMyGithubAccount(githubUsername1))
          .to.emit(reputationOracle, "GithubAccountLinked")
          .withArgs(user1.address, githubUsername1);
      });
      
      it("Should revert if github username is empty", async function () {
        await expect(reputationOracle.connect(user1).linkMyGithubAccount(""))
          .to.be.revertedWith("ReputationOracle: github username cannot be empty");
      });
      
      it("Should revert if address already linked", async function () {
        await reputationOracle.connect(user1).linkMyGithubAccount(githubUsername1);
        await expect(reputationOracle.connect(user1).linkMyGithubAccount(githubUsername2))
          .to.be.revertedWith("ReputationOracle: address already linked");
      });
      
      it("Should revert if github username already linked", async function () {
        await reputationOracle.connect(user1).linkMyGithubAccount(githubUsername1);
        await expect(reputationOracle.connect(user2).linkMyGithubAccount(githubUsername1))
          .to.be.revertedWith("ReputationOracle: github username already linked");
      });
    });
    
    describe("unlinkGithubAccount", function () {
      beforeEach(async function () {
        // Link a GitHub account
        await reputationOracle.linkGithubAccount(user1.address, githubUsername1);
      });
      
      it("Should unlink GitHub account correctly (by owner)", async function () {
        await reputationOracle.unlinkGithubAccount(user1.address);
        
        expect(await reputationOracle.getGithubUsername(user1.address)).to.equal("");
        expect(await reputationOracle.getAddress(githubUsername1)).to.equal(ethers.ZeroAddress);
      });
      
      it("Should emit GithubAccountUnlinked event", async function () {
        await expect(reputationOracle.unlinkGithubAccount(user1.address))
          .to.emit(reputationOracle, "GithubAccountUnlinked")
          .withArgs(user1.address, githubUsername1);
      });
      
      it("Should revert if no github account linked", async function () {
        await expect(reputationOracle.unlinkGithubAccount(user2.address))
          .to.be.revertedWith("ReputationOracle: no github account linked");
      });
      
      it("Should revert if caller is not owner", async function () {
        await expect(reputationOracle.connect(user1).unlinkGithubAccount(user1.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
    
    describe("unlinkMyGithubAccount", function () {
      beforeEach(async function () {
        // Link a GitHub account
        await reputationOracle.connect(user1).linkMyGithubAccount(githubUsername1);
      });
      
      it("Should allow user to unlink their own GitHub account", async function () {
        await reputationOracle.connect(user1).unlinkMyGithubAccount();
        
        expect(await reputationOracle.getGithubUsername(user1.address)).to.equal("");
        expect(await reputationOracle.getAddress(githubUsername1)).to.equal(ethers.ZeroAddress);
      });
      
      it("Should emit GithubAccountUnlinked event", async function () {
        await expect(reputationOracle.connect(user1).unlinkMyGithubAccount())
          .to.emit(reputationOracle, "GithubAccountUnlinked")
          .withArgs(user1.address, githubUsername1);
      });
      
      it("Should revert if no github account linked", async function () {
        await expect(reputationOracle.connect(user2).unlinkMyGithubAccount())
          .to.be.revertedWith("ReputationOracle: no github account linked");
      });
    });
    
    describe("getScore and hasReputation", function () {
      beforeEach(async function () {
        // Set minimum reputation score
        await reputationOracle.updateMinimumScore(50);
        
        // Update scores
        await reputationOracle.connect(oracle).updateScore(githubUsername1, 75);
        await reputationOracle.connect(oracle).updateScore(githubUsername2, 40);
        
        // Link GitHub accounts
        await reputationOracle.connect(user1).linkMyGithubAccount(githubUsername1);
        await reputationOracle.connect(user2).linkMyGithubAccount(githubUsername2);
      });
      
      it("Should return correct score data for linked address", async function () {
        const result = await reputationOracle.getScore(user1.address);
        
        expect(result[0]).to.equal(75); // score
        expect(result[2]).to.equal(githubUsername1); // username
      });
      
      it("Should return zeros for non-linked address", async function () {
        const notLinkedUser = oracle;
        const result = await reputationOracle.getScore(notLinkedUser.address);
        
        expect(result[0]).to.equal(0); // score
        expect(result[1]).to.equal(0); // timestamp
        expect(result[2]).to.equal(""); // username
      });
      
      it("Should return true for hasReputation if user has sufficient score", async function () {
        expect(await reputationOracle.hasReputation(user1.address)).to.equal(true);
      });
      
      it("Should return false for hasReputation if user has insufficient score", async function () {
        expect(await reputationOracle.hasReputation(user2.address)).to.equal(false);
      });
      
      it("Should return false for hasReputation if address not linked", async function () {
        expect(await reputationOracle.hasReputation(oracle.address)).to.equal(false);
      });
    });
  });
  
  describe("Minimum Score Management", function () {
    it("Should update minimum score", async function () {
      const newMinimum = 75;
      await reputationOracle.updateMinimumScore(newMinimum);
      expect(await reputationOracle.minimumReputationScore()).to.equal(newMinimum);
    });
    
    it("Should emit MinimumScoreUpdated event", async function () {
      const newMinimum = 75;
      await expect(reputationOracle.updateMinimumScore(newMinimum))
        .to.emit(reputationOracle, "MinimumScoreUpdated")
        .withArgs(newMinimum);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(reputationOracle.connect(user1).updateMinimumScore(75))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should affect hasReputation results", async function () {
      // Set score
      await reputationOracle.connect(oracle).updateScore(githubUsername1, 60);
      await reputationOracle.connect(user1).linkMyGithubAccount(githubUsername1);
      
      // With minimum 50, user should have sufficient reputation
      await reputationOracle.updateMinimumScore(50);
      expect(await reputationOracle.hasReputation(user1.address)).to.equal(true);
      
      // With minimum 70, user should not have sufficient reputation
      await reputationOracle.updateMinimumScore(70);
      expect(await reputationOracle.hasReputation(user1.address)).to.equal(false);
    });
  });
  
  // Helper function to get the current block timestamp
  async function getBlockTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }
}); 