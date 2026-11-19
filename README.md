# WhatsApp AI Bot (Dual Gateway: Meta Cloud API + Baileys Engine)

A powerful, multi-channel WhatsApp Automation and AI customer assistant supporting both **Official Meta WhatsApp Cloud API** (100% ban-free) and **Baileys Web WebSocket Gateway** (QR & Pairing Code).

## Features

- **Dual Gateway Architecture**:
  - **Meta / Facebook WhatsApp Cloud API (Official)**: Zero ban risk, verified business messaging, automated webhook processing.
  - **Baileys QR & Pairing Code (Web)**: Windows Chrome browser signature, auto-reset for abandoned sessions, zero hassle fallback.
- **AI Engine**:
  - Native Gemini & OpenAI compatible integrations with safety refusal bypass.
  - Built-in Bengali conversation persona and automated multi-package customer handling.
- **Interactive Web Dashboard (`http://localhost:3000`)**:
  - Live status cards, active gateway toggle, auto-reconnect.
  - 1-click test message sender and webhook configuration.
- **Payment & Verification Flow**:
  - Automatic bKash/Nagad transaction and last-digit detection.
  - Safe Imo delivery instructions upon verification.

## Getting Started

1. **Prerequisites**: Node.js v18+ or v20+
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Bot**:
   ```bash
   npm start
   ```
4. Open your browser at `http://localhost:3000`.

## Configuration

Copy `config.example.json` to `config.json` and configure your API keys or manage everything directly from the interactive web dashboard.
