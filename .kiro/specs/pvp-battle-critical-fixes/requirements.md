# Requirements Document

## Introduction

This specification addresses critical production bugs in the PVP battle system that are preventing proper gameplay. The system currently uses mock data instead of real player information, fails to create blockchain transactions for stakes, and does not display beast images properly in the battle arena.

## Glossary

- **Battle Start Page**: The page at `/battle/[id]/start` where players confirm their stake before entering the arena
- **Battle Arena**: The page at `/battle/[id]/arena` where the actual turn-based combat occurs
- **Stake Transaction**: A blockchain transaction that locks the player's wagered tokens
- **Beast Image**: The visual representation of a beast stored in the `image_url` field
- **Mock Data**: Hardcoded placeholder data used for testing that should not appear in production
- **Real Player Data**: Actual battle information fetched from the database including real beasts and opponents

## Requirements

### Requirement 1

**User Story:** As a player, I want to see my actual beast and real opponent information on the battle start page, so that I know who I'm fighting against.

#### Acceptance Criteria

1. WHEN a player navigates to `/battle/[id]/start` THEN the system SHALL fetch and display the actual battle data from the database
2. WHEN the battle data loads THEN the system SHALL display the player's real beast with correct name, level, and type
3. WHEN the battle data loads THEN the system SHALL display the actual opponent's beast with correct name, level, and type
4. WHEN the battle involves a real player opponent THEN the system SHALL display their username or wallet address
5. WHERE battle data cannot be loaded THEN the system SHALL display an error message and prevent battle entry

### Requirement 2

**User Story:** As a player, I want my stake to create a real blockchain transaction, so that my tokens are properly locked and the winner receives the payout.

#### Acceptance Criteria

1. WHEN a player confirms their stake THEN the system SHALL initiate a blockchain transaction to lock the tokens
2. WHEN the transaction is initiated THEN the system SHALL display transaction status to the user
3. WHEN the transaction completes successfully THEN the system SHALL record the transaction hash in the database
4. WHEN the transaction fails THEN the system SHALL display an error message and prevent arena entry
5. WHERE a player attempts to enter the arena without a completed transaction THEN the system SHALL redirect them back to the stake page

### Requirement 3

**User Story:** As a player, I want to see my beast's actual image in the battle arena, so that the battle feels immersive and visually engaging.

#### Acceptance Criteria

1. WHEN the battle arena loads THEN the system SHALL display the player's beast image from the `image_url` field
2. WHEN the battle arena loads THEN the system SHALL display the opponent's beast image from the `image_url` field
3. WHERE a beast has no `image_url` THEN the system SHALL display a default placeholder image
4. WHEN beast images fail to load THEN the system SHALL display a fallback image with proper error handling
5. WHEN images are displayed THEN the system SHALL ensure they are properly sized and styled for the arena layout
