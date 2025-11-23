# Requirements Document

## Introduction

This feature implements a real-time Player vs Player (PVP) battle system that replaces the current mock matchmaking with actual multiplayer functionality. Players can create battle rooms with shareable 6-digit codes, browse available rooms, and join battles in real-time. The system supports Telegram integration for sharing battle invitations and uses real-time subscriptions to synchronize battle state between players.

## Glossary

- **Battle Room**: A waiting lobby where a player has selected their beast and is waiting for an opponent to join
- **Room Code**: A unique 6-digit alphanumeric code used to identify and join a specific battle room
- **Host Player**: The player who creates a battle room and waits for an opponent
- **Joining Player**: The player who joins an existing battle room using a room code
- **Battle State**: The current status of a battle (waiting, in_progress, completed)
- **Real-time Subscription**: A WebSocket connection that pushes database changes to connected clients
- **PVP System**: The Player vs Player battle management system
- **Telegram Share**: The ability to share a battle room code via Telegram messaging

## Requirements

### Requirement 1

**User Story:** As a player, I want to create a battle room with my selected beast, so that I can wait for an opponent to join my battle.

#### Acceptance Criteria

1. WHEN a player selects a beast and creates a room THEN the PVP System SHALL generate a unique 6-digit room code
2. WHEN a battle room is created THEN the PVP System SHALL store the room with status 'waiting' and the host player's information
3. WHEN a battle room is created THEN the PVP System SHALL display the room code prominently to the host player
4. WHEN a battle room is waiting THEN the PVP System SHALL allow the host player to cancel the room
5. WHEN a host player cancels a waiting room THEN the PVP System SHALL delete the room and return the player to the beast selection screen

### Requirement 2

**User Story:** As a player, I want to browse all available battle rooms, so that I can see which battles I can join.

#### Acceptance Criteria

1. WHEN a player navigates to the rooms list THEN the PVP System SHALL display all battle rooms with status 'waiting'
2. WHEN displaying a battle room THEN the PVP System SHALL show the host player's beast name, level, and stats
3. WHEN displaying a battle room THEN the PVP System SHALL show the room code
4. WHEN the rooms list is displayed THEN the PVP System SHALL update in real-time as rooms are created or removed
5. WHEN no rooms are available THEN the PVP System SHALL display a message indicating no active rooms

### Requirement 3

**User Story:** As a player, I want to join a battle room by entering a 6-digit code, so that I can battle against a specific opponent.

#### Acceptance Criteria

1. WHEN a player enters a 6-digit room code THEN the PVP System SHALL validate the code format
2. WHEN a valid room code is submitted THEN the PVP System SHALL check if the room exists and has status 'waiting'
3. WHEN a player joins a valid room THEN the PVP System SHALL update the battle status to 'in_progress' and set the joining player as player2
4. WHEN a player joins a room THEN the PVP System SHALL navigate both players to the battle arena
5. WHEN a player attempts to join a non-existent room THEN the PVP System SHALL display an error message
6. WHEN a player attempts to join a room that is already in progress THEN the PVP System SHALL display an error message

### Requirement 4

**User Story:** As a player, I want to share my battle room code via Telegram, so that I can invite specific friends to battle me.

#### Acceptance Criteria

1. WHEN a player creates a battle room THEN the PVP System SHALL display a share button for Telegram
2. WHEN a player clicks the Telegram share button THEN the PVP System SHALL open Telegram with a pre-formatted message containing the room code
3. WHEN the Telegram message is sent THEN the message SHALL include the room code and a link to join the battle
4. WHEN a recipient clicks the battle link THEN the PVP System SHALL navigate them to the join room interface with the code pre-filled

### Requirement 5

**User Story:** As a host player, I want to see when an opponent joins my room in real-time, so that I know when the battle is starting.

#### Acceptance Criteria

1. WHEN a host player is waiting in a room THEN the PVP System SHALL subscribe to real-time updates for that battle
2. WHEN an opponent joins the room THEN the PVP System SHALL immediately notify the host player
3. WHEN an opponent joins the room THEN the PVP System SHALL display the opponent's beast information to the host
4. WHEN both players are ready THEN the PVP System SHALL automatically transition both players to the battle arena
5. WHEN the real-time connection is lost THEN the PVP System SHALL attempt to reconnect and display a connection status indicator

### Requirement 6

**User Story:** As a player, I want the battle to start automatically when both players are ready, so that I can begin fighting immediately.

#### Acceptance Criteria

1. WHEN both players are in the battle room THEN the PVP System SHALL update the battle status to 'in_progress'
2. WHEN the battle status changes to 'in_progress' THEN the PVP System SHALL determine the first turn based on beast speed stats
3. WHEN the battle starts THEN the PVP System SHALL load both beasts with their full HP and stats
4. WHEN the battle starts THEN the PVP System SHALL navigate both players to the battle arena interface
5. WHEN the battle arena loads THEN the PVP System SHALL display both beasts and indicate whose turn it is

### Requirement 7

**User Story:** As a player, I want to see my opponent's moves in real-time during battle, so that I can follow the battle progression.

#### Acceptance Criteria

1. WHEN a player makes a move THEN the PVP System SHALL record the move in the battle_moves table
2. WHEN a move is recorded THEN the PVP System SHALL broadcast the move to both players via real-time subscription
3. WHEN a player receives a move update THEN the PVP System SHALL display the move animation and damage
4. WHEN a move is executed THEN the PVP System SHALL update both beasts' HP values in real-time
5. WHEN it becomes a player's turn THEN the PVP System SHALL enable their move selection interface

### Requirement 8

**User Story:** As a player, I want the battle to end when one beast reaches zero HP, so that a winner is determined.

#### Acceptance Criteria

1. WHEN a beast's HP reaches zero THEN the PVP System SHALL update the battle status to 'completed'
2. WHEN the battle is completed THEN the PVP System SHALL record the winner_id in the battles table
3. WHEN the battle is completed THEN the PVP System SHALL display the battle outcome to both players
4. WHEN the battle is completed THEN the PVP System SHALL award rewards to the winner
5. WHEN the battle outcome is displayed THEN the PVP System SHALL provide options to return to the main menu or start a new battle

### Requirement 9

**User Story:** As a developer, I want to remove all mock matchmaking logic, so that the system only uses real multiplayer battles.

#### Acceptance Criteria

1. WHEN the PVP System is deployed THEN the system SHALL NOT automatically match players with random opponents
2. WHEN a player selects "Find Match" THEN the PVP System SHALL create a battle room instead of creating a mock battle
3. WHEN the PVP page loads THEN the PVP System SHALL display options to create a room, join a room, or browse rooms
4. WHEN the battle creation API is called THEN the system SHALL require both player1_id and player2_id to be explicitly provided
5. WHEN a battle is created THEN the system SHALL NOT populate player2_id until a real player joins

### Requirement 10

**User Story:** As a player, I want to see a list of my active and past battles, so that I can track my battle history.

#### Acceptance Criteria

1. WHEN a player views their profile THEN the PVP System SHALL display all battles where they were player1 or player2
2. WHEN displaying battle history THEN the PVP System SHALL show the opponent's name, battle outcome, and timestamp
3. WHEN displaying battle history THEN the PVP System SHALL distinguish between active battles and completed battles
4. WHEN a player clicks on an active battle THEN the PVP System SHALL navigate them to the battle arena
5. WHEN a player clicks on a completed battle THEN the PVP System SHALL display the battle summary and results
