# BLACKBOX Module Contracts

## Canonical Objects

- Profile
- Release
- Campaign
- ContentPiece
- CampaignTask
- Asset
- Insight

## Rule
Modules do not own core business entities.
Canonical objects own core business entities.
Modules read from and write to canonical objects.

## Campaign Module
Reads:
- Profile
- Release

Writes:
- Campaign
- ContentPiece
- CampaignTask

## Content Module
Reads:
- Profile
- Release
- Campaign

Writes:
- ContentPiece

## Network Module
Reads:
- Profile
- Release
- Campaign
- ContentPiece

Writes:
- [future outreach objects]
- [future relationship objects]

## Analytics Module
Reads:
- all canonical objects

Writes:
- Insight
- [future outcome records]

## Constraints
- No module may create duplicate representations of Campaign, Release, or Profile
- No module may depend on another module's private internal data shape
- Cross-module intelligence must attach to canonical objects
