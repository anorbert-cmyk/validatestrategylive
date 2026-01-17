# Contributing to ValidateStrategyLive

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to ValidateStrategyLive. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🚀 Getting Started

1. **Fork the repository** on GitHub.
2. **Clone the fork** to your local machine.
3. **Install dependencies** using `pnpm install`.
4. **Create a branch** for your feature or bug fix.
    * `git checkout -b feat/my-awesome-feature`
    * `git checkout -b fix/annoying-bug`

## 🛠 Development Guidelines

### Tech Stack

* **React** (Client)
* **Express** (Server)
* **tRPC** (Client-Server Communication)
* **Tailwind CSS** (Styling)
* **Drizzle ORM** (Database)

### Code Style

* We use **Prettier** for formatting. Run `pnpm format` before committing.
* We use **ESLint** for linting. Run `pnpm check` to catch issues.
* **TypeScript** is strictly enforced. Avoid `any` whenever possible.

### Commits

* We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests or correcting existing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

## 🧪 Testing

* Run unit tests with `pnpm test`.
* Ensure all tests pass before submitting a PR.
* If you add a new feature, please add tests for it.

## 📦 Pull Requests

1. Push your branch to your fork.
2. Open a Pull Request against the `main` branch.
3. Describe your changes in detail. Use the provided PR template if available.
4. Link any related issues (e.g., `Fixes #123`).
5. Wait for review! We try to review PRs within 24-48 hours.

## 🛡 Security Vulnerabilities

If you discover a security vulnerability, please **DO NOT** open a public issue. Email `security@validatestrategylive.com` (or generic equivalent) instead.

## 📜 License

By contributing, you agree that your contributions will be licensed under its MIT License.
