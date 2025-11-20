# Requirements Document

## Introduction

This document specifies improvements to the ArenaRise beast marketplace application, focusing on UI styling restoration, beast creation workflow integration, purchase flow implementation, and removal of mock data. The system integrates with a TON blockchain backend for NFT minting and transfers.

## Glossary

- **Beast**: A procedurally generated NFT creature with combat attributes (HP, Attack, Defense, Speed)
- **Frontend Application**: The Next.js web application that users interact with
- **Backend Service**: The external API service at arenarise-backend.vercel.app that handles blockchain operations
- **TON Wallet**: A user's TON blockchain wallet connected via TonConnect
- **NFT Address**: The blockchain address of a minted beast NFT
- **Battle Moves**: Combat abilities assigned to beasts stored in the database
- **PVP**: Player versus Player battle mode
- **PVE**: Player versus Environment battle mode
- **Mock Data**: Placeholder data used for development that should be replaced with real data

## Requirements

### Requirement 1

**User Story:** As a user, I want to see the retro 8-bit font styling throughout the application, so that the gaming aesthetic is consistent and appealing.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display all text using the retro 8-bit font family
2. WHEN viewing any page THEN the system SHALL apply consistent retro styling to buttons, cards, and UI components
3. WHEN interacting with UI elements THEN the system SHALL maintain the pixel-art aesthetic with appropriate borders and effects

### Requirement 2

**User Story:** As a user, I want to create a beast NFT only when my wallet is connected, so that the beast can be properly associated with my wallet address.

#### Acceptance Criteria

1. WHEN a user accesses the create page without a connected wallet THEN the system SHALL redirect the user to the home page
2. WHEN a user clicks generate beast with a connected wallet THEN the system SHALL call the frontend API endpoint /api/create/beast
3. WHEN the frontend API receives a create request THEN the system SHALL call the backend /api/mint endpoint to mint the NFT
4. WHEN the backend minting succeeds THEN the system SHALL store the beast data in the database with the user's wallet address
5. WHEN storing beast data THEN the system SHALL include all combat attributes extracted from NFT traits

### Requirement 3

**User Story:** As a user, I want to assign battle moves to my newly created beast, so that it can participate in battles.

#### Acceptance Criteria

1. WHEN a beast is created THEN the system SHALL assign default battle moves to the beast in the database
2. WHEN battle moves are assigned THEN the system SHALL link them to the beast's unique identifier
3. WHEN retrieving beast data THEN the system SHALL include the associated battle moves

### Requirement 4

**User Story:** As a user, I want to preview my generated beast before purchasing, so that I can decide if I want to buy it.

#### Acceptance Criteria

1. WHEN a beast is generated THEN the system SHALL display the beast's name, description, and visual representation
2. WHEN displaying the beast THEN the system SHALL show all combat attributes (HP, Attack, Defense, Speed)
3. WHEN displaying the beast THEN the system SHALL show all trait badges (Element, Tier, etc.)
4. WHEN viewing the preview THEN the system SHALL display the purchase price of 1 TON
5. WHEN viewing the preview THEN the system SHALL provide options to regenerate or purchase the beast

### Requirement 5

**User Story:** As a user, I want to purchase a generated beast by paying 1 TON, so that the NFT is minted and transferred to my wallet.

#### Acceptance Criteria

1. WHEN a user clicks the purchase button THEN the system SHALL initiate a TON transaction for 1 TON to the payment address
2. WHEN the payment transaction is initiated THEN the system SHALL send the payment to address 0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX
3. WHEN the payment is confirmed THEN the system SHALL call the frontend /api/purchase/beast endpoint
4. WHEN the purchase API is called THEN the system SHALL call the backend /api/send endpoint to transfer the NFT
5. WHEN the NFT transfer succeeds THEN the system SHALL update the beast ownership in the database to the buyer's wallet address
6. WHEN the purchase completes THEN the system SHALL display a success message and redirect to the inventory page

### Requirement 6

**User Story:** As a user, I want the battle page to default to PVP mode, so that I can quickly access player versus player battles.

#### Acceptance Criteria

1. WHEN a user navigates to the battle page THEN the system SHALL display the PVP tab as the active tab
2. WHEN the PVP tab is active THEN the system SHALL show PVP-specific content and options
3. WHEN switching between tabs THEN the system SHALL maintain proper tab state and content display

### Requirement 7

**User Story:** As a developer, I want to remove all mock data from the application, so that the system uses real data from the database and blockchain.

#### Acceptance Criteria

1. WHEN displaying beasts THEN the system SHALL fetch beast data from the database instead of using mock arrays
2. WHEN displaying enemies THEN the system SHALL fetch enemy data from the database instead of using mock arrays
3. WHEN the database query returns no results THEN the system SHALL display an appropriate empty state message
4. WHEN the database query fails THEN the system SHALL display an error message to the user
