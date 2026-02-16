## [1.1.1](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/compare/v1.1.0...v1.1.1) (2026-02-16)


### Bug Fixes

* **config:** ensure correct semantic-release configuration ([9aa0a79](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/9aa0a79f8693444f1bc1ba032c3d5604caf17584))

# [1.1.0](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/compare/v1.0.1...v1.1.0) (2026-02-16)


### Features

* **ai:** integrate Anthropic Claude (Opus) support ([7daf0d8](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/7daf0d82e9078fb559adeb8d31cb5ae1278b7ad8))

## [1.0.1](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/compare/v1.0.0...v1.0.1) (2026-02-16)


### Bug Fixes

* **perf:** optimize anomaly detection client-side load ([66916df](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/66916df10bab5af0fb7c80592febdecc6a6d231e))

# 1.0.0 (2026-02-16)


### Bug Fixes

* **ci:** patch workflow failures by adding mock env vars and disabling scorecard publishing ([d180ed3](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/d180ed3ed81d55e37a224aadc3e6b4da285709c3))
* **ci:** resolve lint and type-check errors in AI/Compliance modules ([c0a2520](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/c0a25206ea8176efb9523399650061c4ce639db3))
* **ci:** update working directory and cache path for root-level project ([5982ac1](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/5982ac1292264c30e810fbb9209331be5f0c85d2))
* correct PrismaLibSql constructor signature and disable failing scorecard upload ([a47baab](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/a47baab6d5e24b619220a68696d9f92e50f06b3b))
* **deps:** vulnerabilities in next, hono, lodash ([4cf0287](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/4cf0287b6b38436fe5f723a32639cb0b6cdb0c15))
* resolve bugs, security issues, and code quality improvements ([baf6cbf](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/baf6cbf248cd6d4e85f0d4dbb6d8dc24ac004c2f))
* Resolve build errors (voice commands & context types) ([078285a](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/078285a9b0dc9ca69320c192a3bdded65f0d3a4d))
* resolve CI build failures by removing invalid mock DB credentials ([fc1c992](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/fc1c992c90c38885479ccb6d0b934e7d049f5a8b))
* resolve final lint and type errors for production build ([9845ba8](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/9845ba8fef8b985b0b4b0e44b6ea74491f1945da))
* resolve Vercel deployment issues by cleaning repo and fixing db config ([124b26a](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/124b26a726a2679da4288f4e005bd1f984d2ae53))
* update prisma.config.ts for Turso compatibility ([35e2348](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/35e2348c3d77db7718b1e3fcc8c36b132dd59edd))
* Update Scorecard workflow to fix permission errors ([b927123](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/b9271230a25df77b8ad2f56c8e9aba47550415f8))


### Features

* add analytics tracking utility with localStorage storage ([d1f13a1](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/d1f13a1bd7ac1f93b451452be1137eb8927ee8e9))
* add deployment lockdown mode (Basic Auth middleware) ([f33dd03](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/f33dd03425e71c07bbd01e06d33b33cbd63a49a1))
* add error boundary component with retry functionality ([32460f5](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/32460f5249860ada927973b65884985888983f7a))
* Add GitHub webhook endpoint with signature verification and forwarding ([c3b52f6](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/c3b52f699c110f5fb953056c640c4c0b30561161))
* Add JSON file persistence for Audit Logs & async SOAR integration ([96c436e](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/96c436ed9ded8c2f42dd87c3a72aa9564fce77f8))
* add lazy loading for heavy chart and map components ([d15a19a](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/d15a19a3eebda774ee2ee3992694ccc4d22ab0ba))
* add live demo recording and update Vercel URL ([0ad551a](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/0ad551aab9506f006dcf02a68c2b92618fd00da6))
* Add OpenClaw AI agent API endpoint and update database configuration ([be5bdac](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/be5bdac81c7c7078fcf4ea73c4241f281de38f05))
* add real AI integration — MITRE ATT&CK classifier + TensorFlow.js anomaly detection ([b3840cd](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/b3840cdbce4c6da2636d38456c9c48bca9c12137))
* add service worker with offline capability and PWA manifest ([6e7072c](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/6e7072cb3290e0672464d8e3e344ca9da653eca9))
* add skeleton loader components for perceived performance ([aede23a](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/aede23a35a60a9fcfa7474e7cd38f1819798fcb5))
* Add standout features for NIRU - Demo Mode, Voice Narration, Keyboard Shortcuts, README, Kenya Footer ([c56b1ba](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/c56b1ba5518ff294f2a8588d6ed221468a9a19a1))
* Add task issue template and improve issue config ([de42580](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/de425807f5edc87b659d60d65ad908750627b6fb))
* Add Web Crypto API (SHA-256) for Audit Log integrity & PPR optimization ([f609e39](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/f609e39b4621f019ec308209a40b199945ba5670))
* enhance AI system prompt with detailed Kenyan context ([fab624f](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/fab624fd68a0ff74d32a99b7e7ef85b703beec8a))
* enhance repo about section, fix citation, add architecture + highlights to README ([14cd191](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/14cd1919d24f83891b753014dbe4ef25e719fc61))
* Implement Ably multiplayer collaboration and update Vercel build script ([9595709](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/95957099a8528f6fb6a8f158449508b50fb6ee1e))
* Implement National Cyber Emergency Overlay, SOAR Logic, and Audit Trail (100% Health verified) ([48ea9a7](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/48ea9a7deece7bd708f10ed4f05a2cf3f6f8b5c1))
* implement security operations center and AI intelligence dashboard ([4b38279](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/4b38279dba92fb2fff98c417d8faa281a56b7447))
* integrate AI Analysis Panel into Dashboard UI ([135c2d0](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/135c2d01d184a726347a7182ade5d854288a6ded))
* integrate error boundaries, service worker, and analytics tracking ([5e23983](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/5e239835b5d51ce10d796a524a79726c7ec71690))
* integrate real AI endpoint with Google Gemini ([04ad163](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/04ad163c64451c8c79b3ace1ea665cddf6de3635))
* integrate real Gemini AI for threat prediction ([391c1a2](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/391c1a22b8b790af6560b9b367181b22949ef3f1))
* Integrated Kenya Context 'Golden Dataset' with Live Panels ([546180d](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/546180da6c4507e9469c61fa6e9224c21bc38889))
* **intelligence:** implement ransomware tracking, analytics, and negotiation simulation ([6403678](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/6403678151856115d3f766f8a61f48232bbf7729))
* move surveillance monitor to full-width layout ([0eef439](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/0eef4392f05736e3a10f110c1614ac3454361531))
* security hardening (next-auth + middleware + headers) ([77479ab](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/77479ab1796d8c29231ec6aa76a81910c05b09c3))
* Unified NCTIRS platform with cyber + physical threat intelligence ([f03d68e](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/f03d68ea4d8d2e73ed6e2d94a9a19bfe439cc0d0))
* upgrade AI persona to Director-Level Intelligence Fusion Engine ([3753b5a](https://github.com/arapgechina24-lgtm/nctirs-platform-v2/commit/3753b5a3bfceb4c4eae30f752360fc542661e674))

# Changelog

All notable changes to the NCTIRS Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-24

### Added
- GitHub community files (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
- Issue templates for bug reports and feature requests
- Pull request template with checklist
- Project roadmap in README

### Changed
- Updated README with badges and improved documentation

## [1.2.0] - 2026-01-24

### Added
- Surveillance Network Monitor layout improvements
- Full location names display (no truncation)
- Enhanced status indicators with icons

### Changed
- Grid layout optimized (1-2-3 columns)
- Text sizes increased for readability
- Card padding increased for better spacing

## [1.1.0] - 2026-01-24

### Added
- Command Center layout improvements
- Charts now display at full width
- Increased item limits for lists

### Changed
- Regional Threats chart layout (stacked)
- 30-Day Incident Report chart layout (stacked)
- Section headers enlarged
- ThreatMap height increased

## [1.0.0] - 2026-01-24

### Added
- Four Winning Pillars UI components
  - Adversarial Defense Panel
  - Federated Learning Hub
  - Explainable AI Panel
  - Sovereign AI Status Panel
- MAJESTIC SHIELD proposal documentation
- Operations view with 4 Pillars layout

### Changed
- Improved data types and mock data generators
- Enhanced typography across all pillar components

## [0.9.0] - 2026-01-08

### Added
- Initial NCTIRS Dashboard implementation
- Command Center view
- Fusion Center view
- Threat Matrix view
- Analytics view
- Real-time mock data generation

---

[1.3.0]: https://github.com/arapgechina24-lgtm/nctirs-dashboard/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/arapgechina24-lgtm/nctirs-dashboard/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/arapgechina24-lgtm/nctirs-dashboard/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/arapgechina24-lgtm/nctirs-dashboard/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/arapgechina24-lgtm/nctirs-dashboard/releases/tag/v0.9.0
