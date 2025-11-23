# Requirements Document

## Introduction

This feature improves the PVP battle flow by restructuring the user journey to prioritize room selection before beast selection. The current flow requires players to select a beast before creating or joining a room, which creates friction and doesn't align with typical multiplayer game patterns. The improved flow allows players to first commit to a battle room, then select their beast, with the beast selection locked once confirmed to prevent mid-battle changes.

## Glossary

- **PVP Battle System**: The player-versus-player combat system where users battle their beasts against other players in real-time
- **Battle Room**: A virtual space where two players meet to conduct a PVP battle, identified by a unique room code
- **Beast**: A player-owned creature with stats (HP, attack, defense, speed) that participates in battles
- **Room Code**: A 6-character alphanumeric code used to identify and join specific battle rooms
- **Beast Lock**: A mechanism that prevents changing the selected beast once it has been confirmed for a battle room

## Requirements

### Requirement 1

**User Story:** As a player, I want to create or join a battle room before selecting my beast, so that I can commit to a battle first and then choose my fighter strategically.

#### Acceptance Criteria

1. WHEN a player navigates to the PVP battle page THEN the system SHALL display three primary action options: Create Room, Browse Rooms, and Join by Code
2. WHEN a player selects Create Room THEN the system SHALL create a new battle room without requiring beast selection first
3. WHEN a player selects Browse Rooms THEN the system SHALL display available rooms without requiring beast selection first
4. WHEN a player selects Join by Code THEN the system SHALL allow room code entry without requiring beast selection first
5. THE system SHALL NOT require beast selection before room creation or joining actions

### Requirement 2

**User Story:** As a player, I want to select my beast after entering a battle room, so that I can make an informed decision based on the battle context.

#### Acceptance Criteria

1. WHEN a player creates a new battle room THEN the system SHALL redirect the player to the room page and prompt for beast selection
2. WHEN a player joins an existing battle room THEN the system SHALL redirect the player to the room page and prompt for beast selection
3. WHEN a player is in a battle room without a selected beast THEN the system SHALL display the player's available beasts for selection
4. WHEN a player selects a beast in the battle room THEN the system SHALL record the beast selection and update the battle state
5. THE system SHALL display beast selection interface only after the player has entered a battle room

### Requirement 3

**User Story:** As a player, I want my beast selection to be locked once confirmed in a battle room, so that neither player can change their fighter mid-battle.

#### Acceptance Criteria

1. WHEN a player confirms their beast selection in a battle room THEN the system SHALL lock that beast to the battle
2. WHEN a beast is locked to a battle THEN the system SHALL prevent the player from changing their beast selection
3. WHEN both players have locked their beasts THEN the system SHALL transition the battle to the in-progress state
4. WHEN a battle is in-progress or completed THEN the system SHALL maintain the beast lock for both players
5. THE system SHALL display a visual indicator showing that the beast selection is locked

### Requirement 4

**User Story:** As a room creator, I want to wait for an opponent after selecting my beast, so that I can share the room code and prepare for battle.

#### Acceptance Criteria

1. WHEN a room creator selects their beast THEN the system SHALL display a waiting screen with the room code prominently shown
2. WHEN in the waiting state THEN the system SHALL provide options to copy the room code and share via Telegram
3. WHEN an opponent joins the room THEN the system SHALL notify the room creator and display the opponent's beast information
4. WHEN both players have selected beasts THEN the system SHALL automatically start the battle
5. THE system SHALL allow the room creator to cancel the room while waiting for an opponent

### Requirement 5

**User Story:** As a player joining a room, I want to see the room host's beast before selecting mine, so that I can make a strategic choice.

#### Acceptance Criteria

1. WHEN a player joins a battle room THEN the system SHALL display the host's selected beast if already chosen
2. WHEN the host has not selected a beast THEN the system SHALL display a waiting indicator for the host's selection
3. WHEN displaying the host's beast THEN the system SHALL show the beast's name, level, type, and stats
4. WHEN a joining player selects their beast THEN the system SHALL immediately start the battle if the host has already selected
5. THE system SHALL provide clear visual distinction between the host's beast and the player's beast selection area

### Requirement 6

**User Story:** As a player, I want the PVP battle page to focus on room actions rather than beast selection, so that the interface is clearer and more intuitive.

#### Acceptance Criteria

1. WHEN a player navigates to the PVP battle page THEN the system SHALL display room action buttons as the primary interface elements
2. THE system SHALL NOT display beast selection cards on the main PVP battle page
3. WHEN displaying room action buttons THEN the system SHALL use clear, prominent styling to indicate available actions
4. WHEN a player has no beasts THEN the system SHALL display a message directing them to the inventory page
5. THE system SHALL maintain consistent navigation patterns with a clear path back to the main battle menu

### Requirement 7

**User Story:** As a player, I want to browse available rooms and see opponent beasts before joining, so that I can choose battles that interest me.

#### Acceptance Criteria

1. WHEN a player selects Browse Rooms THEN the system SHALL display all available battle rooms with host beast information
2. WHEN displaying available rooms THEN the system SHALL show each host's beast name, level, type, and stats
3. WHEN a player selects a room to join THEN the system SHALL navigate to that room's page for beast selection
4. THE system SHALL update the available rooms list in real-time as rooms are created or filled
5. THE system SHALL prevent players from joining their own created rooms

### Requirement 8

**User Story:** As a player, I want to join a room by entering a code, so that I can quickly connect with a specific opponent.

#### Acceptance Criteria

1. WHEN a player selects Join by Code THEN the system SHALL display a room code input interface
2. WHEN a player enters a valid 6-character room code THEN the system SHALL navigate to that room's page
3. WHEN a player enters an invalid room code THEN the system SHALL display an error message and allow retry
4. WHEN a room code corresponds to a full or completed battle THEN the system SHALL display an appropriate error message
5. THE system SHALL accept room codes in both uppercase and lowercase formats

### Requirement 9

**User Story:** As a developer, I want the battle room state to properly track beast selection status, so that the system can enforce the correct flow and prevent invalid states.

#### Acceptance Criteria

1. WHEN a battle room is created THEN the system SHALL initialize with status 'waiting' and null beast selections
2. WHEN a player selects a beast THEN the system SHALL update the corresponding beast_id field in the battle record
3. WHEN both players have selected beasts THEN the system SHALL update the battle status to 'in_progress'
4. THE system SHALL validate that beast selections belong to the respective players before recording
5. THE system SHALL prevent beast selection changes once a beast has been locked to a battle
