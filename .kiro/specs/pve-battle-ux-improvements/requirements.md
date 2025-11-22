# Requirements Document

## Introduction

The PVE Battle UX Improvements enhance the existing PVE battle system by implementing automatic enemy matching, correcting battle routing to use dedicated PVE arena pages, and integrating RISE token staking with jetton transfers to a specified contract address. These improvements streamline the player experience and enable proper token staking mechanics.

## Glossary

- **System**: The PVE Battle application
- **Player**: A user with a connected wallet who participates in PVE battles
- **Enemy**: An AI-controlled opponent with predefined stats
- **Random Matching**: Automatic selection of an enemy without manual player choice
- **PVE Arena**: The dedicated battle interface for PVE battles at `/battle/pve/[id]`
- **RISE Token**: The jetton token used for staking in battles
- **Jetton Transfer**: A blockchain transaction sending jettons to a contract address
- **Stake Address**: The contract address `0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX` that receives staked RISE tokens
- **Jetton Wallet Address**: The sender's jetton wallet contract address for RISE tokens

## Requirements

### Requirement 1

**User Story:** As a player, I want to be automatically matched with a random enemy, so that I can start battles quickly without manual selection.

#### Acceptance Criteria

1. WHEN a player selects a beast for PVE battle THEN the System SHALL automatically select a random enemy
2. WHEN the random enemy is selected THEN the System SHALL display the selected enemy to the player
3. WHEN the player clicks "Start Battle" THEN the System SHALL create a battle with the randomly selected enemy
4. WHEN selecting a random enemy THEN the System SHALL choose from all available enemies with equal probability
5. WHEN no enemies are available THEN the System SHALL display an error message and prevent battle creation

### Requirement 2

**User Story:** As a player, I want PVE battles to use a dedicated PVE arena page, so that I have a consistent battle experience.

#### Acceptance Criteria

1. WHEN a PVE battle is created THEN the System SHALL navigate to `/battle/pve/[id]` route
2. WHEN the PVE arena page loads THEN the System SHALL display the player's beast and the enemy
3. WHEN the PVE arena page loads THEN the System SHALL fetch real battle data from the database
4. WHEN displaying combatants THEN the System SHALL show actual beast and enemy data, not mock data
5. WHEN the battle completes THEN the System SHALL remain on the PVE arena page to display results

### Requirement 3

**User Story:** As a player, I want to stake RISE tokens when starting a battle, so that I can participate in the staking mechanism.

#### Acceptance Criteria

1. WHEN a player stakes RISE tokens THEN the System SHALL send a jetton transfer to address `0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX`
2. WHEN initiating a jetton transfer THEN the System SHALL use the player's jetton wallet address as the sender
3. WHEN sending jettons THEN the System SHALL convert the stake amount using 9 decimal places for RISE tokens
4. WHEN building the transfer payload THEN the System SHALL use TEP-74 standard with op code `0xf8a7ea5`
5. WHEN the transfer completes THEN the System SHALL proceed with battle creation

### Requirement 4

**User Story:** As a player, I want the jetton transfer to include proper gas and forward amounts, so that the transaction executes successfully.

#### Acceptance Criteria

1. WHEN sending a jetton transfer THEN the System SHALL include a forward TON amount of 0.05 TON for gas
2. WHEN building the transfer payload THEN the System SHALL store the destination address correctly
3. WHEN building the transfer payload THEN the System SHALL store the jetton amount in smallest units
4. WHEN the transfer fails THEN the System SHALL display an error message to the player
5. WHEN the transfer succeeds THEN the System SHALL record the stake amount in the battle record

### Requirement 5

**User Story:** As a system, I want to validate stake data before battle creation, so that only valid stakes are processed.

#### Acceptance Criteria

1. WHEN a player initiates a stake THEN the System SHALL validate the stake amount is greater than zero
2. WHEN a player initiates a stake THEN the System SHALL validate the player has a connected wallet
3. WHEN a player initiates a stake THEN the System SHALL validate the jetton wallet address is provided
4. WHEN validation fails THEN the System SHALL prevent the jetton transfer and display an error
5. WHEN validation succeeds THEN the System SHALL proceed with the jetton transfer

### Requirement 6

**User Story:** As a developer, I want to remove the enemy selection UI, so that players cannot manually choose enemies.

#### Acceptance Criteria

1. WHEN the battle page loads THEN the System SHALL not display the "Choose Your Enemy" section
2. WHEN a beast is selected THEN the System SHALL automatically assign a random enemy
3. WHEN displaying the battle setup THEN the System SHALL show only the selected beast and auto-matched enemy
4. WHEN the UI updates THEN the System SHALL maintain the "Start Battle" button functionality
5. WHEN the page renders THEN the System SHALL use a clean layout without enemy selection cards
