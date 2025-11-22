# Requirements Document

## Introduction

The PVE (Player vs Environment) Battle Rewards system enables players to battle against AI-controlled enemies and earn RISE tokens upon victory. This feature enhances the existing battle system by adding a reward mechanism that incentivizes players to engage in PVE battles.

## Glossary

- **System**: The PVE Battle Rewards application
- **Player**: A user with a connected wallet who owns beasts and participates in battles
- **Beast**: A player-owned NFT character with combat stats (HP, attack, defense, speed)
- **Enemy**: An AI-controlled opponent with predefined stats
- **Battle**: A turn-based combat encounter between a player's beast and an enemy
- **RISE Token**: The reward token (jetton) distributed to players upon winning battles
- **Battle Outcome**: The result of a battle (win or loss)
- **Reward Amount**: The quantity of RISE tokens awarded for winning (200 RISE)

## Requirements

### Requirement 1

**User Story:** As a player, I want to start a PVE battle, so that I can fight enemies and earn rewards.

#### Acceptance Criteria

1. WHEN a player selects a beast and an enemy THEN the System SHALL enable the "Start Battle" button
2. WHEN a player clicks "Start Battle" THEN the System SHALL create a battle record in the database
3. WHEN a battle is created THEN the System SHALL navigate to the battle arena page
4. WHEN the battle arena loads THEN the System SHALL display both the player's beast and the enemy with their stats
5. WHEN the battle arena loads THEN the System SHALL initialize the battle state with full HP for both combatants

### Requirement 2

**User Story:** As a player, I want to execute battle moves, so that I can defeat the enemy.

#### Acceptance Criteria

1. WHEN it is the player turn THEN the System SHALL display available moves for the player's beast
2. WHEN a player selects a move THEN the System SHALL calculate damage based on beast stats and move power
3. WHEN damage is calculated THEN the System SHALL reduce the enemy HP by the damage amount
4. WHEN the player move completes THEN the System SHALL switch to the enemy turn
5. WHEN it is the enemy turn THEN the System SHALL automatically select and execute a move

### Requirement 3

**User Story:** As a player, I want to see the battle outcome, so that I know if I won or lost.

#### Acceptance Criteria

1. WHEN the enemy HP reaches zero THEN the System SHALL declare the player as the winner
2. WHEN the player beast HP reaches zero THEN the System SHALL declare the enemy as the winner
3. WHEN a winner is determined THEN the System SHALL update the battle status to "completed"
4. WHEN the battle completes THEN the System SHALL display the battle outcome to the player
5. WHEN displaying the outcome THEN the System SHALL show whether the player won or lost

### Requirement 4

**User Story:** As a player, I want to receive RISE tokens when I win, so that I am rewarded for my victory.

#### Acceptance Criteria

1. WHEN a player wins a PVE battle THEN the System SHALL award 200 RISE tokens to the player
2. WHEN RISE tokens are awarded THEN the System SHALL transfer them to the player wallet
3. WHEN the transfer completes THEN the System SHALL display the reward amount to the player
4. WHEN a player loses a PVE battle THEN the System SHALL not award any RISE tokens
5. WHEN the reward is processed THEN the System SHALL record the transaction in the database

### Requirement 5

**User Story:** As a player, I want to see my battle history, so that I can track my victories and rewards.

#### Acceptance Criteria

1. WHEN a battle completes THEN the System SHALL store the battle result and reward amount
2. WHEN a player views their profile THEN the System SHALL display recent battles
3. WHEN displaying battle history THEN the System SHALL show the enemy name, outcome, and reward earned
4. WHEN displaying battle history THEN the System SHALL order entries by most recent first
5. WHEN a player has no battle history THEN the System SHALL display a message indicating no previous battles

### Requirement 6

**User Story:** As a system, I want to ensure battle integrity, so that rewards are only given for legitimate victories.

#### Acceptance Criteria

1. WHEN processing a battle outcome THEN the System SHALL verify the battle exists in the database
2. WHEN awarding rewards THEN the System SHALL verify the player is the battle participant
3. WHEN awarding rewards THEN the System SHALL verify the battle status is "completed"
4. WHEN awarding rewards THEN the System SHALL verify the player is marked as the winner
5. WHEN a reward transfer fails THEN the System SHALL log the error and mark the battle as "reward_pending"
