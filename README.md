<a id="readme-top"></a>

<div align="center">

![Expo](https://img.shields.io/badge/Expo-55-111111?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.83-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![React](https://img.shields.io/badge/React-19-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Expo Router](https://img.shields.io/badge/Expo%20Router-file--based-111111?style=for-the-badge&logo=expo&logoColor=white)
![NativeWind](https://img.shields.io/badge/NativeWind-4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-tested-c21325?style=for-the-badge&logo=jest&logoColor=white)

<br />

<h1 align="center">happynachbar mobile</h1>

<p align="center">
  A mobile-first neighborhood app for discovering nearby activities, saving favorites, joining events, and chatting with people in your area.
  <br />
  Built with Expo, React Native, TypeScript, and Expo Router.
  <br />
  <a href="#preview">Preview</a>
  ·
  <a href="#features">Features</a>
  ·
  <a href="#tech-stack">Tech Stack</a>
  ·
  <a href="#project-structure">Project Structure</a>
  ·
  <a href="#local-setup">Local Setup</a>
</p>

</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#overview">Overview</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#preview">Preview</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#local-setup">Local Setup</a></li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#api-connection">API Connection</a></li>
  </ol>
</details>

<br />

<h2 id="overview">Overview</h2>

<p>
This repository contains the mobile client for happynachbar. The app is focused on helping neighbors discover local activities, join events, save favorites, and stay connected through chat.
</p>

<p>
Even though the wider happynachbar ecosystem includes web and backend services, this README is intentionally focused on the mobile experience and mobile development workflow.
</p>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<h2 id="features">Features</h2>

- Browse activities with search and category filters.
- Open detailed activity pages with images, schedule, location, and participant info.
- Save activities to favorites.
- Create new activities with title, description, category, postal code, date, and images.
- Use real-time chat and message inbox views.
- Manage profile data and account information.
- Authentication flows for login, registration, and password recovery.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<h2 id="preview">Preview</h2>

<div align="center">
  <img src="./docs/screenshots/landing-page-device.png" width="220" alt="Landing screen" />
  <img src="./docs/screenshots/home-feed-device.png" width="220" alt="Home feed" />
  <img src="./docs/screenshots/activity-detail-device.png" width="220" alt="Activity detail" />
</div>

<br />

<div align="center">
  <img src="./docs/screenshots/messages-device.png" width="220" alt="Messages inbox" />
  <img src="./docs/screenshots/chat-room-device.png" width="220" alt="Chat room" />
  <img src="./docs/screenshots/profile-device.png" width="220" alt="Profile screen" />
</div>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<h2 id="tech-stack">Tech Stack</h2>

- Expo `~55.0.15`
- React Native `0.83.4`
- React `19.2.0`
- TypeScript `~5.9.2`
- Expo Router `^55.0.12`
- NativeWind `^4.2.2`
- Socket.IO Client `^4.8.3`
- Expo Secure Store
- Expo Image Picker
- Jest + ts-jest
- EAS Build

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<h2 id="project-structure">Project Structure</h2>

```text
apps/mobile/
├─ src/app/                # routes (landing, auth, home, messages, profile, create)
├─ src/components/         # reusable UI and feature components
├─ src/lib/                # API, auth, chat, activities, uploads, helpers
├─ assets/                 # icons, splash, images
├─ __tests__/              # unit tests
├─ .maestro/               # mobile flow / e2e scripts
├─ app.json                # Expo config
└─ eas.json                # EAS build profiles