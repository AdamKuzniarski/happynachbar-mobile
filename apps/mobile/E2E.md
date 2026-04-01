# Mobile E2E

This app now includes two small Maestro flows for issue `#42`.

## Prerequisites

1. Install Maestro on your machine.

   On macOS:

   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   maestro --help
   ```

   Maestro CLI requires Java 17 or newer.
2. Open a terminal and go to the mobile app folder.

   ```bash
   cd apps/mobile
   ```

3. Install the project dependencies if you have not done that yet.

   ```bash
   npm install
   ```

4. Start the Expo development server.

   ```bash
   npm run start
   ```

5. Start the app on a simulator or emulator.

   For iOS, press `i` in the Expo terminal after the dev server has started.

   ```bash
   i
   ```

   For Android, press `a` in the Expo terminal after the dev server has started.

   ```bash
   a
   ```

   You can also start the simulator or emulator manually first and then use the same key
   commands in the Expo terminal.

6. Wait until the app is fully open on the simulator or emulator.

   If this is your first start, let Expo finish bundling before you continue.

7. Make sure the on-screen software keyboard is enabled.

   The `chat-keyboard-visible` flow checks a real keyboard-open state, and `inputText`
   alone does not guarantee that the simulator or emulator will show the software
   keyboard.

   On iOS Simulator, disable the hardware keyboard if needed:

   `I/O` -> `Keyboard` -> disable `Connect Hardware Keyboard`

   On Android Emulator, open the emulator settings and make sure the software keyboard can
   appear when a text input is focused.

## Flows

- `apps/mobile/.maestro/launch-unauth-landing.yaml`
  Verifies that a fresh app launch lands on the public landing screen.

- `apps/mobile/.maestro/chat-keyboard-visible.yaml`
  Opens a dedicated QA screen via deep link and checks that the chat composer input and send button stay visible after focusing the input and opening the keyboard.

## Run

From `apps/mobile`:

```bash
maestro test .maestro/launch-unauth-landing.yaml
maestro test .maestro/chat-keyboard-visible.yaml
```

Or run the whole folder:

```bash
maestro test .maestro
```

The flows are intended to be independent. Each flow launches the app with a fresh state so folder runs behave the same as running a single file.

## Notes

- The keyboard QA screen lives at `/qa-chat-keyboard`.
- It is only available in development builds (`__DEV__`).
- The Maestro keyboard flow is intentionally isolated from live chat data so it stays stable without seeded conversations.
- If the flow stays on `Keyboard safe: waiting for keyboard`, the simulator/emulator likely kept a
  hardware keyboard attached and never showed the software keyboard.
