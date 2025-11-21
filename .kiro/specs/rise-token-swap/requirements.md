# Requirements Document

## Introduction

This specification defines a token swap feature that allows users to purchase RISE jetton tokens by paying TON cryptocurrency. The system integrates with a hosted backend service to facilitate the token transfer after payment confirmation.

## Glossary

- **RISE Token**: A TIP-003 standard jetton token used as in-game currency in ArenaRise
- **TON**: The native cryptocurrency of the TON blockchain
- **Jetton**: TON blockchain's token standard (similar to ERC-20 on Ethereum)
- **Payment Wallet**: The wallet address that receives TON payments (0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX)
- **Backend Service**: The hosted API at arenarise-backend.vercel.app that handles RISE token transfers
- **Swap Page**: The /swap route where users can exchange TON for RISE tokens
- **Exchange Rate**: The fixed conversion rate of 1 TON = 3000 RISE tokens

## Requirements

### Requirement 1

**User Story:** As a user, I want to see the current exchange rate for RISE tokens, so that I know how many tokens I will receive for my TON payment.

#### Acceptance Criteria

1. WHEN a user navigates to the swap page THEN the system SHALL display the exchange rate of 1 TON = 3000 RISE
2. WHEN a user enters a TON amount THEN the system SHALL calculate and display the equivalent RISE token amount
3. WHEN displaying the exchange rate THEN the system SHALL show both the TON amount and RISE amount clearly
4. WHEN the calculation updates THEN the system SHALL format numbers with appropriate decimal places and separators

### Requirement 2

**User Story:** As a user, I want to input the amount of TON I want to spend, so that I can purchase the corresponding amount of RISE tokens.

#### Acceptance Criteria

1. WHEN the swap page loads THEN the system SHALL display an input field for TON amount
2. WHEN a user enters a TON amount THEN the system SHALL validate that the input is a positive number
3. WHEN a user enters an invalid amount THEN the system SHALL display an error message and prevent the swap
4. WHEN a user enters a valid amount THEN the system SHALL enable the swap button
5. WHEN displaying the input THEN the system SHALL show the user's current TON balance for reference

### Requirement 3

**User Story:** As a user, I want to send TON payment to the payment wallet, so that I can initiate the token swap process.

#### Acceptance Criteria

1. WHEN a user clicks the swap button THEN the system SHALL initiate a TON transaction to address 0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX
2. WHEN initiating the transaction THEN the system SHALL set the transaction amount to the user-specified TON amount
3. WHEN the transaction is sent THEN the system SHALL display a loading state indicating payment processing
4. WHEN the transaction fails THEN the system SHALL display an error message and allow the user to retry
5. WHEN the transaction is rejected by the user THEN the system SHALL return to the ready state

### Requirement 4

**User Story:** As a user, I want to receive RISE tokens automatically after my payment is confirmed, so that I can use them immediately in the game.

#### Acceptance Criteria

1. WHEN the TON payment transaction is confirmed THEN the system SHALL call the backend API at arenarise-backend.vercel.app/api/send/rise
2. WHEN calling the backend API THEN the system SHALL send the user's wallet address and the calculated RISE amount
3. WHEN the backend API succeeds THEN the system SHALL display a success message showing the amount of RISE tokens received
4. WHEN the backend API fails THEN the system SHALL display an error message and provide support contact information
5. WHEN the token transfer completes THEN the system SHALL update the displayed RISE balance if available

### Requirement 5

**User Story:** As a user, I want to see my transaction history on the swap page, so that I can track my token purchases.

#### Acceptance Criteria

1. WHEN the swap page loads THEN the system SHALL display a list of recent swap transactions for the connected wallet
2. WHEN displaying transaction history THEN the system SHALL show the TON amount paid, RISE amount received, and timestamp
3. WHEN displaying transaction history THEN the system SHALL show the transaction status (pending, completed, failed)
4. WHEN the user has no transaction history THEN the system SHALL display an empty state message
5. WHEN a new swap completes THEN the system SHALL add the transaction to the history list

### Requirement 6

**User Story:** As a user, I want to connect my wallet before swapping tokens, so that the system knows where to send my RISE tokens.

#### Acceptance Criteria

1. WHEN a user accesses the swap page without a connected wallet THEN the system SHALL display a wallet connection prompt
2. WHEN a user connects their wallet THEN the system SHALL enable the swap interface
3. WHEN the wallet is disconnected THEN the system SHALL disable the swap interface and show the connection prompt
4. WHEN displaying the swap interface THEN the system SHALL show the connected wallet address
