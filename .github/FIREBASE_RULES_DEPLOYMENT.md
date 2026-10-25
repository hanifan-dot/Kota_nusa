# Kota Nusa — Firebase Rules Deployment Guide

This repository contains the existing Realtime Database rules in `database.rules.json` and a `firebase.json` file referencing those rules.

## Safety checklist before any production deployment

1. Back up the current Firebase Realtime Database rules and game data.
2. Confirm the Firebase project ID matches the currently used Kota Nusa project; do not create a replacement project.
3. Validate JSON and test rules using Firebase Local Emulator Suite with real scenarios (players, admin, KTP, orchards, transfers, football, orders).
4. Review any differences between the rules in this repository and those currently active in Firebase.
5. Deploy rules only with an explicitly authorized Firebase account or a securely configured deployment workflow.

**GitHub commits do not automatically change the live database.** Do not enable automatic rules deployment without testing and approval. Never commit credentials or service-account private keys.
